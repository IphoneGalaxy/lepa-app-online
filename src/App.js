import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  addDoc,
  limit,
  where,
} from "firebase/firestore";
import { jsPDF } from "jspdf";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "lepa-banda-marcial.firebaseapp.com",
  projectId: "lepa-banda-marcial",
  storageBucket: "lepa-banda-marcial.firebasestorage.app",
  messagingSenderId: "912755788300",
  appId: "1:912755788300:web:7bb47a058ecc9f2e963c29",
};

const appId = firebaseConfig.projectId;

// Opções de status
const statusOptions = [
  "",
  "P",
  "H",
  "L",
  "LP",
  "M",
  "DST",
  "F",
  "FR",
  "LIC LUTO",
  "LIC PAT",
  "LSAM",
  "LTSPF",
  "LTS",
  "MT",
  "RD",
  "SSV",
  "SV",
  "TRRM",
];
const presenteStatusesParaContagem = ["P", "SV", "SSV"];

// Dados iniciais dos membros
const initialMembersData = [
  // Frente de Banda
  { name: "1 SO ELIEZER", instrument: "FRENTE DE BANDA", status: "" },
  { name: "2 SO FRANÇA", instrument: "FRENTE DE BANDA", status: "" },
  { name: "3 SO MARINHO", instrument: "FRENTE DE BANDA", status: "" },
  { name: "4 SO LAURINDO", instrument: "FRENTE DE BANDA", status: "" },
  { name: "5 CB CORRÊA", instrument: "FRENTE DE BANDA", status: "" },
  // Surdo
  { name: "1 SO FRANCISCO", instrument: "SURDO", status: "" },
  { name: "2 SO A. BARBOSA", instrument: "SURDO", status: "" },
  { name: "3 1SG VALLE", instrument: "SURDO", status: "" },
  { name: "4 2SG SÁVIO", instrument: "SURDO", status: "" },
  { name: "5 2SG HUGO", instrument: "SURDO", status: "" },
  { name: "6 2SG F. DIAS", instrument: "SURDO", status: "" },
  { name: "7 3SG WILLIAN", instrument: "SURDO", status: "" },
  { name: "8 3SG GABRIEL", instrument: "SURDO", status: "" },
  // Prato
  { name: "1 SO FABIO", instrument: "PRATO", status: "" },
  { name: "2 SO ZAPHIRO", instrument: "PRATO", status: "" },
  { name: "3 SO CHRYSTIAN", instrument: "PRATO", status: "" },
  { name: "4 SO CANELA", instrument: "PRATO", status: "" },
  { name: "5 2SG PONTES", instrument: "PRATO", status: "" },
  { name: "6 3SG RUIVO", instrument: "PRATO", status: "" },
  { name: "7 CB CAIO", instrument: "PRATO", status: "" },
  // Caixa
  { name: "1 SO RONALDO", instrument: "CAIXA", status: "" },
  { name: "2 SO PORTO", instrument: "CAIXA", status: "" },
  { name: "3 1SG BRAGA", instrument: "CAIXA", status: "" },
  { name: "4 2SG FORTUNA", instrument: "CAIXA", status: "" },
  { name: "5 2SG VARGAS", instrument: "CAIXA", status: "" },
  { name: "6 2SG MENDONÇA", instrument: "CAIXA", status: "" },
  { name: "7 2SG MELLO", instrument: "CAIXA", status: "" },
  { name: "8 3SG DA ROCHA", instrument: "CAIXA", status: "" },
  { name: "9 3SG JHONAS", instrument: "CAIXA", status: "" },
  { name: "10 3SG RUFINO", instrument: "CAIXA", status: "" },
  { name: "11 CB CASSIANO", instrument: "CAIXA", status: "" },
  { name: "12 CB M. ALVES", instrument: "CAIXA", status: "" },
  // Bombo
  { name: "1 1SG LABI", instrument: "BOMBO", status: "" },
  { name: "2 2SG FÁBIO", instrument: "BOMBO", status: "" },
  { name: "3 2SG PEDRO", instrument: "BOMBO", status: "" },
  { name: "4 2SG GASPAR", instrument: "BOMBO", status: "" },
  { name: "5 2SG DA SILVA", instrument: "BOMBO", status: "" },
  { name: "6 2SG GUILHERME", instrument: "BOMBO", status: "" },
  { name: "7 3SG SAMPAIO", instrument: "BOMBO", status: "" },
  { name: "8 3SG FERREIRA", instrument: "BOMBO", status: "" },
  { name: "9 CB R. SOUZA", instrument: "BOMBO", status: "" },
  { name: "10 CB AMORIM", instrument: "BOMBO", status: "" },
  { name: "11 CB OLIVEIRA", instrument: "BOMBO", status: "" },
  // Flautim/Lira
  { name: "1 2SG TIBURCIO", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "2 2SG TIAGO", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "3 2SG IGOR", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "4 2SG JOAB", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "5 2SG DARLAN", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "6 3SG VICTOR HUGO", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "7 3SG MACHADO", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "8 3SG PECANHA", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "9 3SG ANDERSON SILVA", instrument: "FLAUTIM/LIRA", status: "" },
  { name: "10 CB LOPES", instrument: "FLAUTIM/LIRA", status: "" },
  // Trombonito
  { name: "1 1SG COSTA JUNIOR", instrument: "TROMBONITO", status: "" },
  { name: "2 2SG ANTUNES", instrument: "TROMBONITO", status: "" },
  { name: "3 2SG PAULO RICARDO", instrument: "TROMBONITO", status: "" },
  { name: "4 2SG DE CASTRO", instrument: "TROMBONITO", status: "" },
  { name: "5 2SG FRANCIMILDO", instrument: "TROMBONITO", status: "" },
  { name: "6 2SG ALLISON", instrument: "TROMBONITO", status: "" },
  { name: "7 2SG LEAL", instrument: "TROMBONITO", status: "" },
  { name: "8 2SG B. PEREIRA", instrument: "TROMBONITO", status: "" },
  { name: "9 2SG ELIZEU", instrument: "TROMBONITO", status: "" },
  { name: "10 3SG ARAÚJO", instrument: "TROMBONITO", status: "" },
  { name: "11 3SG TENÓRIO", instrument: "TROMBONITO", status: "" },
  { name: "12 3SG VALDES", instrument: "TROMBONITO", status: "" },
  { name: "13 3SG ABINOAM", instrument: "TROMBONITO", status: "" },
  { name: "14 3SG GONÇALVES", instrument: "TROMBONITO", status: "" },
  { name: "15 3SG SILVA", instrument: "TROMBONITO", status: "" },
  { name: "16 CB S. VIEIRA", instrument: "TROMBONITO", status: "" },
  { name: "17 CB M. CORRÊA", instrument: "TROMBONITO", status: "" },
  // Gaita
  { name: "1 SO DE ALMEIDA", instrument: "GAITA", status: "" },
  { name: "2 SO DE OLIVEIRA", instrument: "GAITA", status: "" },
  { name: "3 1SG MATEUS", instrument: "GAITA", status: "" },
  { name: "4 2SG R. TAVARES", instrument: "GAITA", status: "" },
  { name: "5 2SG VINÍCIUS", instrument: "GAITA", status: "" },
  { name: "6 2SG MOURÃO", instrument: "GAITA", status: "" },
  { name: "7 2SG PEREIRA", instrument: "GAITA", status: "" },
  { name: "8 3SG RAFAEL", instrument: "GAITA", status: "" },
  { name: "9 3SG GARCIA", instrument: "GAITA", status: "" },
  { name: "10 3SG LAURITZEN", instrument: "GAITA", status: "" },
  { name: "11 3SG RAPOSO", instrument: "GAITA", status: "" },
  { name: "12 3SG RUBENS", instrument: "GAITA", status: "" },
  { name: "13 3SG SOARES", instrument: "GAITA", status: "" },
  { name: "14 3SG M. FERREIRA", instrument: "GAITA", status: "" },
  { name: "15 CB DE FREITAS", instrument: "GAITA", status: "" },
  { name: "16 CB FRANCO", instrument: "GAITA", status: "" },
  { name: "17 CB SABINO", instrument: "GAITA", status: "" },
  { name: "18 CB MATHEUS", instrument: "GAITA", status: "" },
  { name: "19 CB ALVARENGA", instrument: "GAITA", status: "" },
  { name: "20 CB MARTINS", instrument: "GAITA", status: "" },
  // Trompete
  { name: "1 SO THÔUBERTE", instrument: "TROMPETE", status: "" },
  { name: "2 SO HUMBERTO", instrument: "TROMPETE", status: "" },
  { name: "3 1SG TEMÍSTOCLES", instrument: "TROMPETE", status: "" },
  { name: "4 2SG JUNIOR", instrument: "TROMPETE", status: "" },
  { name: "5 2SG RIBEIRO", instrument: "TROMPETE", status: "" },
  { name: "6 2SG ALBERTO", instrument: "TROMPETE", status: "" },
  { name: "7 2SG BARBOSA", instrument: "TROMPETE", status: "" },
  { name: "8 3SG TALLYS", instrument: "TROMPETE", status: "" },
  { name: "9 CB FABIO", instrument: "TROMPETE", status: "" },
  { name: "10 CB SANDERSON", instrument: "TROMPETE", status: "" },
  { name: "11 CB SERRANO", instrument: "TROMPETE", status: "" },
  { name: "12 CB M. SILVEIRA", instrument: "TROMPETE", status: "" },
  { name: "13 CB ADRIEL", instrument: "TROMPETE", status: "" },
  { name: "14 CB VINICIUS", instrument: "TROMPETE", status: "" },
  { name: "15 CB DA ROCHA", instrument: "TROMPETE", status: "" },
  { name: "16 CB BARROS", instrument: "TROMPETE", status: "" },
  { name: "17 CB MUMBARRA", instrument: "TROMPETE", status: "" },
];

// Função de normalização de texto (remove acentos e converte para minúsculas)
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Decompõe caracteres acentuados em base + diacrítico
    .replace(/[\u0300-\u036f]/g, ""); // Remove os diacríticos
};

// Funções auxiliares
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
};

const calculateFilledCount = (membersArray) => {
  return membersArray.filter((member) => member.status !== "").length;
};

const getRankOrder = (memberName) => {
  const rankOrderMap = {
    SO: 0,
    "1SG": 1,
    "2SG": 2,
    "3SG": 3,
    CB: 4,
    OUTROS: 99,
  };
  const match = memberName.match(/^(\d+\s*)?(SO|1SG|2SG|3SG|CB)\b/);
  if (match && rankOrderMap[match[2]] !== undefined) {
    return rankOrderMap[match[2]];
  }
  return rankOrderMap["OUTROS"];
};

const getStatusColorClass = (status) => {
  if (status === "P") return "text-green-700 font-semibold";
  if (status === "SV" || status === "SSV") return "text-blue-700 font-semibold";
  if (status && status !== "") return "text-red-700 font-semibold";
  return "text-gray-500";
};

const getStatusColorRgb = (status) => {
  if (status === "P") return [21, 128, 61];
  if (status === "SV" || status === "SSV") return [29, 78, 216];
  if (status && status !== "") return [185, 28, 28];
  return [0, 0, 0];
};

const getNameWithoutSequence = (fullName) => {
  if (!fullName) return "";
  const match = fullName.match(/^\d+\s*(.*)/);
  return match ? match[1] : fullName;
};

// Componentes
const ToastMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg ${bgColor} text-white z-50`}
    >
      {message}
    </div>
  );
};

const ConfirmModal = ({
  message,
  type,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}) => {
  let buttons;
  if (type === "100percent") {
    buttons = (
      <>
        <button
          onClick={() => onConfirm("continueEditing")}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sim, Continuar Editando
        </button>
        <button
          onClick={() => onConfirm("cancelLoading")}
          className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
        >
          Não, Voltar ao Histórico
        </button>
      </>
    );
  } else {
    buttons = (
      <>
        <button
          onClick={onCancel}
          className="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
        >
          {cancelText || "Não"}
        </button>
        <button
          onClick={() => onConfirm()}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {confirmText || "Sim"}
        </button>
      </>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-lg">
        <p className="mb-4 text-lg font-semibold text-gray-800">{message}</p>
        <div className="flex justify-end space-x-4">{buttons}</div>
      </div>
    </div>
  );
};

const exportLepaToTxt = (lepaDate, lepaMembers) => {
  let content = "\uFEFF";
  content += `*LEPA CIA DE BANDAS*\n`;
  content += `${formatDisplayDate(lepaDate)}\n\n`;

  const exportStats = {
    TOTAL: lepaMembers.length,
    PRESENTES: 0,
    AUSENTES: 0,
    FALTANDO: 0,
  };
  statusOptions
    .filter((option) => option !== "")
    .forEach((option) => {
      exportStats[option] = 0;
    });

  lepaMembers.forEach((member) => {
    if (member.status === "") {
      exportStats.FALTANDO++;
    } else if (exportStats[member.status] !== undefined) {
      exportStats[member.status]++;
    }

    if (presenteStatusesParaContagem.includes(member.status)) {
      exportStats.PRESENTES++;
    } else if (member.status !== "") {
      exportStats.AUSENTES++;
    }
  });

  content += `*BANDA MARCIAL*\n\n`;
  content += `*TOTAL: ${exportStats.TOTAL}*\n\n`;
  content += `*PRESENTES: ${exportStats.PRESENTES}*\n\n`;

  if (exportStats.AUSENTES > 0 || exportStats.FALTANDO === 0) {
    content += `*AUSENTES: ${exportStats.AUSENTES}*\n\n`;
  }

  if (exportStats.FALTANDO > 0) {
    content += `*FALTANDO: ${exportStats.FALTANDO}*\n\n`;
  }

  const detailedStatusesForExport = [
    "H",
    "M",
    "RD",
    "F",
    "L",
    "MT",
    "FR",
    "LTS",
    "LTSPF",
    "TRRM",
    "LSAM",
    "LIC LUTO",
    "LIC PAT",
    "DST",
  ];

  detailedStatusesForExport.forEach((statusKey) => {
    let membersWithStatus = lepaMembers.filter((m) => m.status === statusKey);
    membersWithStatus.sort((a, b) => {
      const rankA = getRankOrder(a.name);
      const rankB = getRankOrder(b.name);
      if (rankA !== rankB) return rankA - rankB;
      const nameA = a.name.replace(/^\d+\s*(SO|1SG|2SG|3SG|CB)?\s*/, "").trim();
      const nameB = b.name.replace(/^\d+\s*(SO|1SG|2SG|3SG|CB)?\s*/, "").trim();
      return nameA.localeCompare(nameB);
    });
    if (
      membersWithStatus.length > 0 ||
      ["M", "F", "MT", "TRRM", "LSAM", "LIC LUTO", "LIC PAT"].includes(
        statusKey
      )
    ) {
      content += `*${statusKey} ${membersWithStatus.length
        .toString()
        .padStart(2, "0")}*\n`;
      membersWithStatus.forEach((member) => {
        const nameWithoutLeadingNumber = member.name.replace(/^\d+\s*/, "");
        content += `${nameWithoutLeadingNumber}\n`;
      });
      content += "\n";
    }
  });

  const filename = `LEPA_${lepaDate}.txt`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportResumoToPdf = (lepaDate, lepaMembers) => {
  const pdf = new jsPDF();
  const displayDate = formatDisplayDate(lepaDate);
  let yPos = 22;
  const lineSpacing = 7;
  const columnSpacing = 65;
  const leftMargin = 14;
  const pageHeight = pdf.internal.pageSize.height;
  const bottomMargin = 20;

  pdf.setFontSize(18);
  pdf.text("Resumo Geral da Banda - LEPA", leftMargin, yPos);
  yPos += lineSpacing * 1.5;

  pdf.setFontSize(12);
  pdf.text(`Data: ${displayDate}`, leftMargin, yPos);
  yPos += lineSpacing * 1.5;

  const stats = { TOTAL: lepaMembers.length, PRESENTES: 0, AUSENTES: 0 };
  const detailedStatusCounts = {};
  statusOptions
    .filter((opt) => opt !== "")
    .forEach((opt) => (detailedStatusCounts[opt] = 0));

  lepaMembers.forEach((member) => {
    if (presenteStatusesParaContagem.includes(member.status)) {
      stats.PRESENTES++;
    } else if (member.status !== "") {
      stats.AUSENTES++;
    }
    if (
      member.status !== "" &&
      detailedStatusCounts[member.status] !== undefined
    ) {
      detailedStatusCounts[member.status]++;
    }
  });

  pdf.setTextColor(0, 0, 0);
  pdf.text(`Total de Militares: ${stats.TOTAL}`, leftMargin, yPos);
  yPos += lineSpacing;
  pdf.text(`Presentes: ${stats.PRESENTES}`, leftMargin, yPos);
  yPos += lineSpacing;
  pdf.text(`Ausentes: ${stats.AUSENTES}`, leftMargin, yPos);
  yPos += lineSpacing * 2;

  pdf.setFontSize(14);
  pdf.text("Detalhes por Status:", leftMargin, yPos);
  yPos += lineSpacing * 1.5;
  const yDetailedListStart = yPos;
  pdf.setFontSize(10);

  let currentX = leftMargin;
  let currentColumn = 1;
  const maxColumns = 3;

  const availableHeightForList = pageHeight - yDetailedListStart - bottomMargin;
  const itemsPerColumnApprox = Math.max(
    1,
    Math.floor(availableHeightForList / lineSpacing) - 1
  );

  const statusesToDisplay = statusOptions.filter((option) => {
    const count = detailedStatusCounts[option];
    return (
      option !== "" &&
      (count > 0 ||
        ["P", "SV", "SSV", "H", "M", "F", "LTS", "LTSPF"].includes(option))
    );
  });

  let itemCountInCurrentColumn = 0;

  statusesToDisplay.forEach((statusItem) => {
    const count = detailedStatusCounts[statusItem];

    if (
      itemCountInCurrentColumn >= itemsPerColumnApprox &&
      currentColumn < maxColumns
    ) {
      currentX += columnSpacing;
      currentColumn++;
      yPos = yDetailedListStart;
      itemCountInCurrentColumn = 0;
    } else if (
      yPos > pageHeight - bottomMargin &&
      itemCountInCurrentColumn > 0
    ) {
      pdf.addPage();
      yPos = 20;
      currentX = leftMargin;
      currentColumn = 1;
      itemCountInCurrentColumn = 0;
      pdf.setFontSize(14);
      pdf.text("Detalhes por Status (continuação):", leftMargin, yPos);
      yPos += lineSpacing * 1.5;
      pdf.setFontSize(10);
    }

    const [r, g, b] = getStatusColorRgb(statusItem);
    pdf.setTextColor(r, g, b);
    pdf.text(`${statusItem}: ${count}`, currentX, yPos);

    yPos += lineSpacing;
    itemCountInCurrentColumn++;
  });

  pdf.save(`Resumo_LEPA_${lepaDate}.pdf`);
};

const MissingPersonnelModal = ({ missingData, onClose, onSelectMember }) => {
  const [selectedNaipeInModal, setSelectedNaipeInModal] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">
            Militares Faltando
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        {selectedNaipeInModal ? (
          <div>
            <button
              onClick={() => setSelectedNaipeInModal(null)}
              className="mb-4 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 ease-in-out font-semibold text-sm"
            >
              ← Voltar aos Naipes
            </button>
            <h3 className="text-lg font-semibold mb-3">
              {selectedNaipeInModal}
            </h3>
            <ul className="space-y-1">
              {missingData[selectedNaipeInModal].map((member, index) => (
                <li key={index}>
                  <button
                    onClick={() => onSelectMember(member)}
                    className="w-full text-left p-2 rounded-md text-gray-800 hover:bg-blue-100 transition duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-blue-400"
                  >
                    {getNameWithoutSequence(member.name)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            {Object.keys(missingData).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(missingData).map(([naipe, members]) => (
                  <li key={naipe}>
                    <button
                      onClick={() => setSelectedNaipeInModal(naipe)}
                      className="w-full text-left p-3 rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition duration-200 ease-in-out flex justify-between items-center"
                    >
                      <span>{naipe}</span>
                      <span className="font-bold">{members.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-600">
                Nenhum militar faltando no momento!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StatusDetailModal = ({ status, membersWithStatus, onClose }) => {
  if (!status || membersWithStatus.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 shadow-xl w-11/12 max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-blue-700">
            Militares com Status:{" "}
            <span className={getStatusColorClass(status)}>{status}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto flex-grow">
          {membersWithStatus.length > 0 ? (
            <ul className="space-y-2">
              {membersWithStatus.map((member, index) => (
                <li
                  key={index}
                  className="p-2 border-b border-gray-200 last:border-b-0"
                >
                  <span className="font-medium text-gray-800">
                    {getNameWithoutSequence(member.name)}
                  </span>
                  <span className="text-sm text-blue-600 ml-2">
                    ({member.instrument})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-600">
              Nenhum militar encontrado com este status.
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedInstrument, setSelectedInstrument] = useState("Todos");
  const [members, setMembers] = useState(() =>
    initialMembersData.map((m) => ({ ...m, status: "" }))
  );
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const CORRECT_PASSWORD = "1234";

  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveMessageType, setSaveMessageType] = useState("success");
  const [errorMessage, setErrorMessage] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalContent, setConfirmModalContent] = useState({
    message: "",
    type: null,
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [showMissingModal, setShowMissingModal] = useState(false);

  const [savedLepas, setSavedLepas] = useState({
    currentMonth: [],
    pastMonths: {},
  });
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingLepa, setIsLoadingLepa] = useState(false);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  const [isLepaFinalizada, setIsLepaFinalized] = useState(false);
  const [lepaDoDiaExiste, setLepaDoDiaExiste] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [showStatusDetailModal, setShowStatusDetailModal] = useState(false);
  const [statusDetailModalContent, setStatusDetailModalContent] = useState({
    status: "",
    members: [],
  });

  const [hasCheckedPastLepas, setHasCheckedPastLepas] = useState(false);

  useEffect(() => {
    const locallyAuthenticated = localStorage.getItem("lepaUserAuthenticated");
    if (locallyAuthenticated === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);
      setDb(firestore);
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setIsAuthReady(true);
        } else {
          setIsAuthReady(false);
          setUserId(null);
          try {
            await signInAnonymously(firebaseAuth);
          } catch (error) {
            console.error("Erro ao tentar login anônimo:", error);
            setErrorMessage("Falha na autenticação anônima: " + error.message);
            setIsAuthReady(true);
          }
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Erro CRÍTICO ao inicializar Firebase:", error);
      setErrorMessage(
        "Erro CRÍTICO ao inicializar o banco de dados: " + error.message
      );
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const normalizedSearch = normalizeText(searchTerm.trim());
    const results = initialMembersData
      .filter((member) => normalizeText(member.name).includes(normalizedSearch))
      .map((member) => ({ name: member.name, instrument: member.instrument }));
    setSearchResults(results.slice(0, 10));
  }, [searchTerm]);

  useEffect(() => {
    const currentEditingDate = formatDate(new Date());
    if (unsavedChanges && currentPage === "lepaEntry" && !isLepaFinalizada) {
      try {
        const lepaDraft = {
          membersData: members,
          date: currentEditingDate,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(
          `lepaDraft_${appId}_${currentEditingDate}`,
          JSON.stringify(lepaDraft)
        );
      } catch (e) {
        console.error("Erro ao salvar rascunho no localStorage:", e);
      }
    }
  }, [members, unsavedChanges, currentPage, isLepaFinalizada]);

  const saveLepaVersion = useCallback(
    async (lepaDataToSave, dateOfLepa) => {
      if (!db || !isAuthReady) return false;
      const versionsColRef = collection(
        db,
        "artifacts",
        appId,
        "lepas",
        dateOfLepa,
        "versions"
      );
      try {
        await addDoc(versionsColRef, {
          membersData: lepaDataToSave,
          filledCount: calculateFilledCount(lepaDataToSave),
          timestamp: serverTimestamp(),
        });
        const qVersions = query(versionsColRef, orderBy("timestamp", "desc"));
        const versionsSnapshot = await getDocs(qVersions);
        if (versionsSnapshot.docs.length > 3) {
          const batch = writeBatch(db);
          versionsSnapshot.docs.slice(3).forEach((docToDelete) => {
            batch.delete(docToDelete.ref);
          });
          await batch.commit();
        }
        return true;
      } catch (error) {
        console.error("DEBUG: Erro ao salvar versão da LEPA:", error);
        return false;
      }
    },
    [db, isAuthReady]
  );

  const saveLepaStateRealtime = useCallback(
    async (currentMembers, dateToSave) => {
      if (!db || !isAuthReady || isLepaFinalizada || isSaving) {
        console.log(
          "saveLepaStateRealtime: Condições não atendidas para salvar.",
          { db: !!db, isAuthReady, isLepaFinalizada, isSaving }
        );
        return false;
      }
      setIsSaving(true);
      const lepaDocRef = doc(db, "artifacts", appId, "lepas", dateToSave);
      const dataToSaveToMain = {
        membersData: currentMembers,
        filledCount: calculateFilledCount(currentMembers),
        timestamp: serverTimestamp(),
        date: dateToSave,
        finalized: isLepaFinalizada,
      };
      try {
        await setDoc(lepaDocRef, dataToSaveToMain, { merge: true });
        if (!isLepaFinalizada) {
          await saveLepaVersion(currentMembers, dateToSave);
        }
        localStorage.removeItem(`lepaDraft_${appId}_${dateToSave}`);
        setUnsavedChanges(false);
        console.log("SAVE_REALTIME: Sucesso para", dateToSave);
        setIsSaving(false);
        return true;
      } catch (error) {
        console.error(
          "SAVE_REALTIME: Erro ao salvar LEPA no Firestore:",
          error
        );
        setErrorMessage("Falha ao salvar alterações em tempo real.");
        setSaveMessageType("error");
        setIsSaving(false);
        return false;
      }
    },
    [db, isAuthReady, isLepaFinalizada, isSaving, saveLepaVersion]
  );

  useEffect(() => {
    const loadCurrentDateLepa = async () => {
      if (!db || !userId || !isAuthReady || !isAuthenticated) return;

      const currentDateToLoad = formatDate(new Date());
      if (selectedDate !== currentDateToLoad && currentPage === "lepaEntry") {
        const lepaHistDocRef = doc(
          db,
          "artifacts",
          appId,
          "lepas",
          selectedDate
        );
        const docSnapHist = await getDoc(lepaHistDocRef);
        if (!docSnapHist.exists()) {
          setSelectedDate(currentDateToLoad);
        }
        return;
      }
      if (selectedDate !== currentDateToLoad && currentPage !== "lepaEntry") {
        setSelectedDate(currentDateToLoad);
        return;
      }

      setIsLoadingLepa(true);
      setSaveMessage("");
      setErrorMessage("");

      const lepaDocRef = doc(
        db,
        "artifacts",
        appId,
        "lepas",
        currentDateToLoad
      );
      try {
        const docSnap = await getDoc(lepaDocRef);
        if (docSnap.exists()) {
          const loadedData = docSnap.data();
          setMembers(loadedData.membersData);
          setIsLepaFinalized(loadedData.finalized === true);
          setUnsavedChanges(false);
          setLepaDoDiaExiste(true);
        } else {
          const versionsQuery = query(
            collection(
              db,
              "artifacts",
              appId,
              "lepas",
              currentDateToLoad,
              "versions"
            ),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          const versionsSnapshot = await getDocs(versionsQuery);

          if (!versionsSnapshot.empty) {
            const latestVersionData = versionsSnapshot.docs[0].data();
            setMembers(latestVersionData.membersData);
            setIsLepaFinalized(false);
            setUnsavedChanges(true);
            setLepaDoDiaExiste(true);
          } else {
            setMembers(initialMembersData.map((m) => ({ ...m, status: "" })));
            setUnsavedChanges(false);
            setIsLepaFinalized(false);
            setLepaDoDiaExiste(false);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar LEPA da data atual:", error);
        setErrorMessage("Erro ao carregar dados da LEPA: " + error.message);
        setSaveMessageType("error");
        setMembers(initialMembersData.map((m) => ({ ...m, status: "" })));
        setIsLepaFinalized(false);
        setLepaDoDiaExiste(false);
      } finally {
        setIsLoadingLepa(false);
      }
    };

    if (currentPage === "lepaEntry" && isAuthenticated) {
      loadCurrentDateLepa();
    } else if (currentPage === "home" && isAuthenticated && db && isAuthReady) {
      const checkLepaDoDia = async () => {
        const currentDate = formatDate(new Date());
        if (selectedDate !== currentDate) {
          setSelectedDate(currentDate);
        }
        const lepaDocRef = doc(db, "artifacts", appId, "lepas", currentDate);
        try {
          const docSnap = await getDoc(lepaDocRef);
          if (docSnap.exists()) {
            setLepaDoDiaExiste(true);
          } else {
            const versionsQuery = query(
              collection(
                db,
                "artifacts",
                appId,
                "lepas",
                currentDate,
                "versions"
              ),
              orderBy("timestamp", "desc"),
              limit(1)
            );
            const versionsSnapshot = await getDocs(versionsQuery);
            setLepaDoDiaExiste(!versionsSnapshot.empty);
          }
        } catch (error) {
          console.error("Erro ao verificar LEPA do dia na home:", error);
          setLepaDoDiaExiste(false);
        }
      };
      checkLepaDoDia();
    }
  }, [db, userId, isAuthReady, currentPage, selectedDate, isAuthenticated]);

  const handleCreateNewLepa = useCallback(() => {
    const currentDate = formatDate(new Date());
    if (selectedDate !== currentDate) {
      setSelectedDate(currentDate);
    }
    setMembers(initialMembersData.map((m) => ({ ...m, status: "" })));
    setIsLepaFinalized(false);
    setUnsavedChanges(false);
    setSelectedInstrument("Todos");
    setSearchTerm("");
    setCurrentPage("lepaEntry");
  }, [selectedDate]);

  useEffect(() => {
    let unsubscribe = () => {};
    const dateToMonitor = selectedDate;

    if (
      isAuthReady &&
      db &&
      userId &&
      currentPage === "lepaEntry" &&
      !isLepaFinalizada &&
      isAuthenticated
    ) {
      const lepaDocRef = doc(db, "artifacts", appId, "lepas", dateToMonitor);
      unsubscribe = onSnapshot(
        lepaDocRef,
        (docSnap) => {
          if (
            docSnap.exists() &&
            !isSaving &&
            docSnap.data().date === dateToMonitor
          ) {
            const latestData = docSnap.data();
            if (latestData.finalized) {
              if (dateToMonitor === selectedDate) {
                setIsLepaFinalized(true);
                setMembers(latestData.membersData);
              }
              return;
            }

            const latestFilledCount = latestData.filledCount || 0;
            const currentLocalFilledCount = calculateFilledCount(
              membersRef.current
            );

            if (latestFilledCount > currentLocalFilledCount) {
              console.log(
                "ONSNAPSHOT: Versão remota mais completa. Atualizando local."
              );
              setMembers(latestData.membersData);
              setUnsavedChanges(false);
            } else if (
              latestFilledCount === currentLocalFilledCount &&
              JSON.stringify(latestData.membersData) !==
                JSON.stringify(membersRef.current)
            ) {
              console.log(
                "ONSNAPSHOT: Mesma contagem, dados diferentes. Atualizando local."
              );
              setMembers(latestData.membersData);
              setUnsavedChanges(false);
            }
          }
        },
        (error) => {
          console.error("Erro no listener onSnapshot:", error);
        }
      );
    }
    return () => unsubscribe();
  }, [
    db,
    userId,
    isAuthReady,
    currentPage,
    isSaving,
    isLepaFinalizada,
    selectedDate,
    membersRef,
    isAuthenticated,
  ]);

  const fetchSavedDates = useCallback(async () => {
    if (!db || !userId) return;
    setIsLoadingHistory(true);
    setErrorMessage("");

    try {
      const q = query(
        collection(db, "artifacts", appId, "lepas"),
        orderBy("date", "desc")
      );
      const querySnapshot = await getDocs(q);

      const lepaysByMonth = {};
      const currentMonthLepas = [];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const lepaDate = new Date(data.date.replace(/-/g, "/")); // Corrige formato para o construtor Date
        const lepaMonth = lepaDate.getMonth();
        const lepaYear = lepaDate.getFullYear();

        const filledCount = data.filledCount || 0;
        const totalMembers = initialMembersData.length;
        const percentage =
          totalMembers > 0 ? Math.round((filledCount / totalMembers) * 100) : 0;

        const lepaEntry = {
          date: docSnap.id,
          percentage: percentage,
          finalized: data.finalized === true,
        };

        if (lepaYear === currentYear && lepaMonth === currentMonth) {
          currentMonthLepas.push(lepaEntry);
        } else {
          const monthKey = new Date(lepaYear, lepaMonth).toLocaleString(
            "pt-BR",
            { month: "long", year: "numeric" }
          );
          const capitalizedMonthKey =
            monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
          if (!lepaysByMonth[capitalizedMonthKey]) {
            lepaysByMonth[capitalizedMonthKey] = [];
          }
          lepaysByMonth[capitalizedMonthKey].push(lepaEntry);
        }
      });

      setSavedLepas({
        currentMonth: currentMonthLepas,
        pastMonths: lepaysByMonth,
      });
    } catch (error) {
      console.error("Erro ao carregar e agrupar histórico:", error);
      setErrorMessage("Erro ao carregar histórico de LEPAS.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [db, userId]);

  const finalizePastLepas = useCallback(async () => {
    if (!db || !isAuthenticated) return;

    const todayStr = formatDate(new Date());
    const totalMembers = initialMembersData.length;

    const q = query(
      collection(db, "artifacts", appId, "lepas"),
      where("finalized", "==", false)
    );

    try {
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log("Nenhuma LEPA não finalizada encontrada para verificação.");
        return;
      }

      const batch = writeBatch(db);
      let finalizationCount = 0;

      querySnapshot.forEach((docSnap) => {
        const lepaData = docSnap.data();
        if (lepaData.date && lepaData.date < todayStr) {
          const filledCount = lepaData.filledCount || 0;
          if (filledCount === totalMembers) {
            console.log(
              `Finalizando automaticamente a LEPA de ${docSnap.id}...`
            );
            batch.update(docSnap.ref, { finalized: true });
            finalizationCount++;
          }
        }
      });

      if (finalizationCount > 0) {
        await batch.commit();
        console.log(
          `${finalizationCount} LEPA(s) passada(s) foram finalizadas automaticamente.`
        );
        setSaveMessage(
          `${finalizationCount} LEPA(s) anterior(es) foram finalizadas.`
        );
        setSaveMessageType("info");
        if (currentPage === "history") {
          fetchSavedDates();
        }
      }
    } catch (error) {
      console.error(
        "Erro ao tentar finalizar LEPA's passadas automaticamente:",
        error
      );
      setErrorMessage("Falha ao verificar LEPA's antigas.");
      setSaveMessageType("error");
    }
  }, [db, isAuthenticated, currentPage, fetchSavedDates]);

  useEffect(() => {
    if (db && isAuthReady && isAuthenticated && !hasCheckedPastLepas) {
      finalizePastLepas();
      setHasCheckedPastLepas(true);
    }
  }, [
    db,
    isAuthReady,
    isAuthenticated,
    hasCheckedPastLepas,
    finalizePastLepas,
  ]);

  useEffect(() => {
    if (
      isAuthReady &&
      db &&
      userId &&
      currentPage === "history" &&
      isAuthenticated
    ) {
      fetchSavedDates();
    }
  }, [isAuthReady, db, userId, currentPage, fetchSavedDates, isAuthenticated]);

  const customInstrumentOrder = useMemo(
    () => [
      "FRENTE DE BANDA",
      "BOMBO",
      "CAIXA",
      "CAIXA/QUAD/SURDO",
      "PRATO/SURDO",
      "GAITA/LIRA",
      "GAITA",
      "FLAUTIM",
      "TROMPETE",
      "TROMBONITO/TROMPETE",
      "TROMBONITO",
      "SURDO",
      "PRATO",
      "FLAUTIM/LIRA",
    ],
    []
  );
  const instruments = useMemo(() => {
    const uniqueInstruments = [
      ...new Set(initialMembersData.map((member) => member.instrument)),
    ];
    return [
      "Todos",
      ...uniqueInstruments.sort((a, b) => {
        const indexA = customInstrumentOrder.indexOf(a);
        const indexB = customInstrumentOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      }),
    ];
  }, [customInstrumentOrder]);

  const filteredMembers = useMemo(() => {
    if (selectedInstrument === "Todos") return [];
    return members.filter((member) => member.instrument === selectedInstrument);
  }, [selectedInstrument, members]);

  const naipeSummaryStats = useMemo(() => {
    const stats = { TOTAL: filteredMembers.length, PRESENTES: 0, AUSENTES: 0 };
    filteredMembers.forEach((member) => {
      if (presenteStatusesParaContagem.includes(member.status)) {
        stats.PRESENTES++;
      } else if (member.status !== "") {
        stats.AUSENTES++;
      }
    });
    return stats;
  }, [filteredMembers]);

  const handleStatusChange = useCallback(
    async (memberIndex, newStatus) => {
      if (isLepaFinalizada || selectedDate !== formatDate(new Date())) return;

      const updatedMembers = members.map((member, idx) =>
        idx === memberIndex ? { ...member, status: newStatus } : member
      );
      setMembers(updatedMembers);
      setUnsavedChanges(true);

      await saveLepaStateRealtime(updatedMembers, selectedDate);
    },
    [members, isLepaFinalizada, saveLepaStateRealtime, selectedDate]
  );

  const globalSummaryStats = useMemo(() => {
    const stats = {
      TOTAL: members.length,
      PRESENTES: 0,
      AUSENTES: 0,
      FALTANDO: 0,
    };
    statusOptions
      .filter((option) => option !== "")
      .forEach((option) => {
        stats[option] = 0;
      });

    members.forEach((member) => {
      if (member.status === "") stats.FALTANDO++;
      else if (stats[member.status] !== undefined) stats[member.status]++;

      if (presenteStatusesParaContagem.includes(member.status)) {
        stats.PRESENTES++;
      } else if (member.status !== "") {
        stats.AUSENTES++;
      }
    });
    return stats;
  }, [members]);

  const globalFillPercentage = useMemo(() => {
    const filled = calculateFilledCount(members);
    const total = members.length;
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [members]);

  const missingPersonnelByNaipe = useMemo(() => {
    const missingByNaipe = {};
    members.forEach((member) => {
      if (member.status === "") {
        if (!missingByNaipe[member.instrument])
          missingByNaipe[member.instrument] = [];
        missingByNaipe[member.instrument].push(member);
      }
    });
    const sortedMissingByNaipe = {};
    customInstrumentOrder.forEach((naipe) => {
      if (missingByNaipe[naipe]) {
        sortedMissingByNaipe[naipe] = missingByNaipe[naipe].sort((a, b) => {
          const rankA = getRankOrder(a.name);
          const rankB = getRankOrder(b.name);
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        });
      }
    });
    return sortedMissingByNaipe;
  }, [members, customInstrumentOrder]);

  const handleFinalizeLepa = async () => {
    if (selectedDate !== formatDate(new Date())) {
      setErrorMessage(
        "Apenas a LEPA da data atual pode ser finalizada a partir desta tela."
      );
      setSaveMessageType("error");
      return;
    }

    if (
      !db ||
      !userId ||
      !isAuthReady ||
      isLepaFinalizada ||
      globalFillPercentage < 100
    ) {
      setErrorMessage("A LEPA deve estar 100% preenchida para ser finalizada.");
      setSaveMessageType("error");
      return;
    }
    const dateToFinalize = selectedDate;

    setShowConfirmModal(true);
    setConfirmModalContent({
      message:
        "Esta LEPA será finalizada. Após a finalização, ela não poderá mais ser editada e as versões anteriores (rascunhos) serão apagadas. Deseja continuar?",
      type: "finalize",
      confirmText: "Finalizar LEPA",
      cancelText: "Cancelar",
      onConfirm: async () => {
        setShowConfirmModal(false);
        setIsSaving(true);
        setSaveMessage("");
        setErrorMessage("");
        const lepaDocRef = doc(db, "artifacts", appId, "lepas", dateToFinalize);
        try {
          const finalMembersState = membersRef.current;
          await setDoc(lepaDocRef, {
            membersData: finalMembersState,
            filledCount: calculateFilledCount(finalMembersState),
            timestamp: serverTimestamp(),
            date: dateToFinalize,
            finalized: true,
          });
          const versionsColRef = collection(
            db,
            "artifacts",
            appId,
            "lepas",
            dateToFinalize,
            "versions"
          );
          const versionsSnapshot = await getDocs(versionsColRef);
          if (!versionsSnapshot.empty) {
            const batch = writeBatch(db);
            versionsSnapshot.docs.forEach((docToDelete) =>
              batch.delete(docToDelete.ref)
            );
            await batch.commit();
          }
          setIsLepaFinalized(true);
          setUnsavedChanges(false);
          setSaveMessage(
            `LEPA de ${formatDisplayDate(
              dateToFinalize
            )} finalizada com sucesso!`
          );
          setSaveMessageType("success");
          fetchSavedDates();
          localStorage.removeItem(`lepaDraft_${appId}_${dateToFinalize}`);
        } catch (error) {
          console.error("Erro ao finalizar LEPA:", error);
          setErrorMessage("Erro ao finalizar a LEPA: " + error.message);
          setSaveMessageType("error");
        } finally {
          setIsSaving(false);
        }
      },
      onCancel: () => setShowConfirmModal(false),
    });
  };

  const handleDeleteLepa = async (dateToDelete) => {
    if (!db || !userId) return;
    setShowConfirmModal(true);
    setConfirmModalContent({
      message: `Você tem certeza que deseja excluir a LEPA de ${formatDisplayDate(
        dateToDelete
      )}? Todas as suas versões também serão apagadas. Esta ação não pode ser desfeita.`,
      type: "default",
      confirmText: "Excluir LEPA",
      onConfirm: async () => {
        setShowConfirmModal(false);
        setIsLoadingHistory(true);
        setErrorMessage("");
        setSaveMessage("");
        try {
          const versionsColRef = collection(
            db,
            "artifacts",
            appId,
            "lepas",
            dateToDelete,
            "versions"
          );
          const versionsSnapshot = await getDocs(versionsColRef);
          if (!versionsSnapshot.empty) {
            const batch = writeBatch(db);
            versionsSnapshot.docs.forEach((docToDelete) =>
              batch.delete(docToDelete.ref)
            );
            await batch.commit();
          }
          const lepaDocRef = doc(db, "artifacts", appId, "lepas", dateToDelete);
          await deleteDoc(lepaDocRef);

          setSaveMessage(
            `LEPA para ${formatDisplayDate(dateToDelete)} excluída com sucesso!`
          );
          setSaveMessageType("success");
          fetchSavedDates();
        } catch (error) {
          console.error("Erro ao excluir LEPA:", error);
          setErrorMessage("Erro ao excluir a LEPA: " + error.message);
          setSaveMessageType("error");
        } finally {
          setIsLoadingHistory(false);
        }
      },
      onCancel: () => setShowConfirmModal(false),
    });
  };

  const handleGoBack = (targetPage) => {
    if (
      currentPage === "lepaEntry" &&
      ((selectedDate !== formatDate(new Date()) && !unsavedChanges) ||
        isLepaFinalizada)
    ) {
      setCurrentPage(targetPage);
      setSaveMessage("");
      setErrorMessage("");
      if (targetPage === "home") {
        setSelectedDate(formatDate(new Date()));
        setSearchTerm("");
      }
      return;
    }

    if (currentPage === "lepaEntry" && unsavedChanges && !isLepaFinalizada) {
      setShowConfirmModal(true);
      setConfirmModalContent({
        message:
          "Você tem certeza que deseja sair? As alterações não salvas na LEPA atual serão perdidas.",
        type: "default",
        confirmText: "Sair sem Salvar",
        onConfirm: () => {
          setShowConfirmModal(false);
          setUnsavedChanges(false);
          setCurrentPage(targetPage);
          setSaveMessage("");
          setErrorMessage("");
          if (targetPage === "home") {
            setSelectedDate(formatDate(new Date()));
            setSearchTerm("");
          }
        },
        onCancel: () => setShowConfirmModal(false),
      });
    } else {
      setCurrentPage(targetPage);
      setSaveMessage("");
      setErrorMessage("");
      if (targetPage === "home") {
        setSelectedDate(formatDate(new Date()));
        setSearchTerm("");
      }
    }
  };

  const handleExportFromHistory = async (dateToExport, formatType) => {
    if (!db || !userId) return;
    setIsLoadingLepa(true);
    setErrorMessage("");
    setSaveMessage("");
    try {
      const lepaDocRef = doc(db, "artifacts", appId, "lepas", dateToExport);
      const docSnap = await getDoc(lepaDocRef);
      if (docSnap.exists()) {
        const loadedData = docSnap.data();
        if (formatType === "txt") {
          exportLepaToTxt(dateToExport, loadedData.membersData);
          setSaveMessage(
            `LEPA de ${formatDisplayDate(dateToExport)} exportada para .TXT!`
          );
        } else if (formatType === "pdf") {
          exportResumoToPdf(dateToExport, loadedData.membersData);
          setSaveMessage(
            `Resumo da LEPA de ${formatDisplayDate(
              dateToExport
            )} exportado para .PDF!`
          );
        }
        setSaveMessageType("success");
      } else {
        setErrorMessage(
          `Nenhuma LEPA encontrada para exportar na data: ${formatDisplayDate(
            dateToExport
          )}`
        );
        setSaveMessageType("error");
      }
    } catch (error) {
      console.error(
        `Erro ao exportar LEPA (${formatType}) do histórico:`,
        error
      );
      setErrorMessage(
        `Erro ao exportar a LEPA selecionada (${formatType}): ` + error.message
      );
      setSaveMessageType("error");
    } finally {
      setIsLoadingLepa(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError("");
      localStorage.setItem("lepaUserAuthenticated", "true");
    } else {
      setPasswordError("Senha incorreta. Tente novamente.");
    }
  };

  const handleLocalLogout = () => {
    localStorage.removeItem("lepaUserAuthenticated");
    setIsAuthenticated(false);
    setPasswordInput("");
    setCurrentPage("home");
    setSelectedDate(formatDate(new Date()));
    setSearchTerm("");
  };

  const handleViewLepaFromHistory = async (dateToView) => {
    if (!db || !userId) return;
    setIsLoadingLepa(true);
    setErrorMessage("");
    setSaveMessage("");
    try {
      const lepaDocRef = doc(db, "artifacts", appId, "lepas", dateToView);
      const docSnap = await getDoc(lepaDocRef);
      if (docSnap.exists()) {
        const loadedData = docSnap.data();
        setMembers(loadedData.membersData);
        setSelectedDate(dateToView);
        setIsLepaFinalized(loadedData.finalized === true);
        setUnsavedChanges(false);
        setSelectedInstrument("Todos");
        setSearchTerm("");
        setCurrentPage("lepaEntry");
      } else {
        setErrorMessage(
          `Nenhuma LEPA encontrada para visualizar na data: ${formatDisplayDate(
            dateToView
          )}`
        );
        setSaveMessageType("error");
      }
    } catch (error) {
      console.error("Erro ao carregar LEPA para visualização:", error);
      setErrorMessage("Erro ao carregar a LEPA selecionada: " + error.message);
      setSaveMessageType("error");
    } finally {
      setIsLoadingLepa(false);
    }
  };

  const handleSelectMissingMember = (member) => {
    setSelectedInstrument(member.instrument);
    setShowMissingModal(false);
    setSearchTerm("");
  };

  const handleSelectMemberFromSearch = (member) => {
    setSelectedInstrument(member.instrument);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleStatusSummaryClick = (status) => {
    if (status === "P" || globalSummaryStats[status] === 0) return;

    const membersWithClickedStatus = members
      .filter((member) => member.status === status)
      .map((member) => ({ name: member.name, instrument: member.instrument }))
      .sort((a, b) => {
        const nameA = getNameWithoutSequence(a.name).trim();
        const nameB = getNameWithoutSequence(b.name).trim();
        return nameA.localeCompare(nameB);
      });

    setStatusDetailModalContent({
      status: status,
      members: membersWithClickedStatus,
    });
    setShowStatusDetailModal(true);
  };

  const renderLepaHistoryItem = (lepaEntry) => (
    <div
      key={lepaEntry.date}
      className={`flex items-center justify-between rounded-md p-3 shadow-sm ${
        lepaEntry.finalized ? "bg-green-100" : "bg-gray-100 hover:bg-gray-200"
      } transition-colors duration-150`}
    >
      <button
        onClick={() => handleViewLepaFromHistory(lepaEntry.date)}
        disabled={isLoadingLepa}
        className="flex-grow text-left p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-75"
        title={`Visualizar LEPA de ${formatDisplayDate(lepaEntry.date)}`}
      >
        <span
          className={`font-bold ${
            lepaEntry.finalized ? "text-green-800" : "text-blue-800"
          }`}
        >
          {formatDisplayDate(lepaEntry.date)}
        </span>
        <span
          className={`ml-4 font-bold ${
            lepaEntry.finalized ? "text-green-700" : "text-purple-700"
          }`}
        >
          {lepaEntry.percentage}%
        </span>
        {lepaEntry.finalized && (
          <span className="ml-2 text-xs font-semibold">(FINALIZADA)</span>
        )}
      </button>
      <div className="flex space-x-2 ml-4 flex-shrink-0">
        <button
          onClick={() => handleExportFromHistory(lepaEntry.date, "txt")}
          disabled={isLoadingLepa}
          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition duration-200 ease-in-out disabled:opacity-50"
        >
          .TXT
        </button>
        <button
          onClick={() => handleExportFromHistory(lepaEntry.date, "pdf")}
          disabled={isLoadingLepa}
          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition duration-200 ease-in-out disabled:opacity-50"
        >
          .PDF Resumo
        </button>
        {!lepaEntry.finalized && (
          <button
            onClick={() => handleDeleteLepa(lepaEntry.date)}
            disabled={isLoadingHistory || isLoadingLepa}
            className="px-3 py-1 bg-red-700 text-white rounded-md text-sm hover:bg-red-800 transition duration-200 ease-in-out disabled:opacity-50"
          >
            Excluir
          </button>
        )}
      </div>
    </div>
  );

  // ----- RENDERIZAÇÃO -----
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 font-sans text-gray-800 flex items-center justify-center">
        <div className="mx-auto max-w-sm rounded-xl bg-white p-8 shadow-xl text-center">
          <h1 className="mb-6 text-3xl font-extrabold text-blue-700">
            Acesso Restrito
          </h1>
          <p className="mb-4 text-gray-600">
            Por favor, digite a senha para continuar.
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Digite a senha"
            />
            {passwordError && (
              <p className="text-red-500 mb-4">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-bold text-white shadow-md transition duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4 font-sans text-gray-800">
      {showConfirmModal && <ConfirmModal {...confirmModalContent} />}
      {showMissingModal && (
        <MissingPersonnelModal
          missingData={missingPersonnelByNaipe}
          onClose={() => setShowMissingModal(false)}
          onSelectMember={handleSelectMissingMember}
        />
      )}
      {showStatusDetailModal && (
        <StatusDetailModal
          status={statusDetailModalContent.status}
          membersWithStatus={statusDetailModalContent.members}
          onClose={() => setShowStatusDetailModal(false)}
        />
      )}
      {saveMessage && (
        <ToastMessage
          message={saveMessage}
          type={saveMessageType}
          onClose={() => setSaveMessage("")}
        />
      )}
      {errorMessage && (
        <ToastMessage
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage("")}
        />
      )}

      {currentPage === "home" && (
        <div className="mx-auto mt-20 max-w-md rounded-xl bg-white p-8 shadow-xl text-center">
          <h1 className="mb-8 text-3xl font-extrabold text-blue-700">
            Bem-vindo à LEPA da Banda Marcial
          </h1>
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleCreateNewLepa}
              className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-bold text-white shadow-md transition duration-200 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            >
              {lepaDoDiaExiste && selectedDate === formatDate(new Date())
                ? "Continuar LEPA do Dia"
                : "Iniciar LEPA do Dia"}
            </button>
            <button
              onClick={() => {
                setCurrentPage("history");
                fetchSavedDates();
              }}
              className="rounded-lg bg-purple-600 px-6 py-3 text-lg font-bold text-white shadow-md transition duration-200 ease-in-out hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-75"
            >
              Histórico de LEPAS
            </button>
            <button
              onClick={handleLocalLogout}
              className="mt-4 rounded-lg bg-gray-500 px-6 py-2 text-md font-bold text-white shadow-md transition duration-200 ease-in-out hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              Sair (Logout Local)
            </button>
          </div>
        </div>
      )}

      {currentPage === "lepaEntry" && (
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() => handleGoBack("home")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 ease-in-out font-semibold text-sm"
            >
              ← Voltar
            </button>
            <h1 className="text-center text-4xl font-extrabold text-blue-700 flex-grow mt-2">
              <span className="block">LEPA DA BANDA MARCIAL</span>
            </h1>
            <button
              onClick={() => exportLepaToTxt(selectedDate, members)}
              disabled={isSaving || members.length === 0 || isLoadingLepa}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-200 ease-in-out font-semibold text-sm disabled:opacity-50"
            >
              Exportar .TXT
            </button>
          </div>
          {(isLepaFinalizada || selectedDate !== formatDate(new Date())) && (
            <p className="text-center text-lg font-semibold text-red-600 mb-4">
              (Visualizando LEPA de {formatDisplayDate(selectedDate)} - Somente
              Leitura)
            </p>
          )}

          <div className="mb-6 flex flex-wrap justify-center items-center gap-4 rounded-lg bg-blue-50 p-3 text-sm font-semibold text-blue-800 shadow-md">
            <span>
              Total:{" "}
              <span className="font-bold">{globalSummaryStats.TOTAL}</span>
            </span>
            <span>
              Presentes:{" "}
              <span className="font-bold text-green-700">
                {globalSummaryStats.PRESENTES}
              </span>
            </span>
            <span>
              Ausentes:{" "}
              <span className="font-bold text-red-700">
                {globalSummaryStats.AUSENTES}
              </span>
            </span>
            {globalSummaryStats.FALTANDO > 0 && (
              <span className="text-orange-700 flex items-center">
                Faltando:{" "}
                <span className="font-bold mr-1">
                  {globalSummaryStats.FALTANDO}
                </span>
                <button
                  onClick={() => setShowMissingModal(true)}
                  className="ml-1 p-1 rounded-full bg-orange-200 text-orange-800 hover:bg-orange-300 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-75"
                  title="Ver detalhes dos militares faltando"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </span>
            )}
            <span className="ml-4 text-purple-700">
              Progresso:{" "}
              <span className="font-bold">{globalFillPercentage}%</span>
            </span>
          </div>

          <div className="mb-8 flex flex-col items-center justify-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <p className="text-lg font-semibold text-gray-700">
              Data da LEPA:{" "}
              <span className="font-bold text-blue-700">
                {formatDisplayDate(selectedDate)}
              </span>
            </p>

            {!isLepaFinalizada &&
              selectedDate === formatDate(new Date()) &&
              globalFillPercentage === 100 && (
                <button
                  onClick={handleFinalizeLepa}
                  disabled={isSaving || !isAuthReady}
                  className="w-full rounded-lg bg-red-600 px-6 py-2 text-lg font-bold text-white shadow-md transition duration-200 ease-in-out hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 disabled:opacity-50 md:w-auto"
                >
                  {isSaving ? "Finalizando..." : "Finalizar LEPA"}
                </button>
              )}
          </div>

          {/* Campo de Pesquisa por Militar */}
          <div className="mb-6">
            <label
              htmlFor="search-member"
              className="block text-lg font-semibold text-gray-700 mb-1"
            >
              Pesquisar Militar por Nome:
            </label>
            <input
              type="text"
              id="search-member"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome do militar..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Resultados da Pesquisa */}
          {searchTerm.trim().length >= 2 && (
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-gray-50 shadow">
              <h3 className="text-md font-semibold text-gray-700 mb-2">
                Resultados da Pesquisa:
              </h3>
              {searchResults.length > 0 ? (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {searchResults.map((member, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleSelectMemberFromSearch(member)}
                        className="w-full text-left text-sm text-gray-800 p-2 hover:bg-blue-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors duration-150"
                      >
                        <span className="font-medium">{member.name}</span> -{" "}
                        <span className="text-blue-600 font-semibold">
                          {member.instrument}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhum militar encontrado para "{searchTerm}".
                </p>
              )}
            </div>
          )}

          <div className="mb-8 flex flex-col items-center justify-center space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <label
              htmlFor="instrument-select"
              className="text-lg font-semibold text-gray-700"
            >
              Filtrar por Naipe:
            </label>
            <div className="relative w-full md:w-auto">
              <select
                id="instrument-select"
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value)}
                disabled={isLoadingLepa}
                className="block w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-8 text-lg leading-tight text-gray-700 shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100"
              >
                {instruments.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    {instrument}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="h-4 w-4 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-gray-50 p-6 shadow-inner">
            <h2 className="mb-4 text-center text-2xl font-bold text-blue-600">
              Membros do Naipe (
              {selectedInstrument === "Todos"
                ? "Selecione um Naipe"
                : selectedInstrument}
              )
            </h2>
            {selectedInstrument !== "Todos" && (
              <div className="mb-4 flex flex-wrap justify-center gap-4 rounded-md bg-white p-2 text-sm font-semibold text-gray-700 shadow-sm">
                <span>
                  Total no Naipe:{" "}
                  <span className="font-bold">{naipeSummaryStats.TOTAL}</span>
                </span>
                <span>
                  Presentes:{" "}
                  <span className="font-bold text-green-700">
                    {naipeSummaryStats.PRESENTES}
                  </span>
                </span>
                <span>
                  Ausentes:{" "}
                  <span className="font-bold text-red-700">
                    {naipeSummaryStats.AUSENTES}
                  </span>
                </span>
              </div>
            )}
            {filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMembers.map((member) => {
                  const originalIndex = members.findIndex(
                    (m) =>
                      m.name === member.name &&
                      m.instrument === member.instrument
                  );
                  const match = member.name.match(/^(\d+)\s*(.*)/);
                  const sequenceNumber = match ? match[1] : "";
                  const restOfName = match ? match[2] : member.name;
                  return (
                    <div
                      key={originalIndex}
                      className="rounded-md bg-white p-3 shadow-sm transition duration-200 ease-in-out hover:shadow-md flex items-center"
                    >
                      {sequenceNumber && (
                        <span
                          className="text-gray-400 text-sm font-mono mr-2"
                          style={{ minWidth: "1.5em" }}
                        >
                          {sequenceNumber}.
                        </span>
                      )}
                      <div className="flex-grow">
                        <p className="text-md font-medium text-gray-900">
                          {restOfName}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">
                          {member.instrument}
                        </p>
                        <div className="relative">
                          <select
                            value={member.status}
                            onChange={(e) =>
                              handleStatusChange(originalIndex, e.target.value)
                            }
                            disabled={
                              isLepaFinalizada ||
                              isLoadingLepa ||
                              selectedDate !== formatDate(new Date())
                            }
                            className={`block w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm leading-tight shadow-sm hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-500 ${getStatusColorClass(
                              member.status
                            )}`}
                          >
                            {statusOptions.map((option) => (
                              <option
                                key={option}
                                value={option}
                                className={getStatusColorClass(option)}
                              >
                                {option === "" ? "Selecione..." : option}
                              </option>
                            ))}
                          </select>
                          {!(
                            isLepaFinalizada ||
                            selectedDate !== formatDate(new Date())
                          ) && (
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                              <svg
                                className="h-4 w-4 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-600">
                {selectedInstrument === "Todos"
                  ? "Selecione um naipe para ver os militares."
                  : "Nenhum membro encontrado para o naipe selecionado."}
              </p>
            )}
          </div>

          {selectedInstrument === "Todos" && (
            <div className="rounded-lg bg-gray-50 p-6 shadow-inner">
              <h2 className="mb-4 text-center text-2xl font-bold text-blue-600">
                Resumo Geral da Banda
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {statusOptions
                  .filter((option) => option !== "")
                  .map((option) => (
                    <div
                      key={option}
                      className={`rounded-md bg-white p-3 shadow-sm ${
                        option !== "P" && globalSummaryStats[option] > 0
                          ? "cursor-pointer hover:bg-gray-100 transition-colors"
                          : ""
                      }`}
                      onClick={() =>
                        option !== "P" &&
                        globalSummaryStats[option] > 0 &&
                        handleStatusSummaryClick(option)
                      }
                      role={
                        option !== "P" && globalSummaryStats[option] > 0
                          ? "button"
                          : undefined
                      }
                      tabIndex={
                        option !== "P" && globalSummaryStats[option] > 0
                          ? 0
                          : undefined
                      }
                      onKeyDown={(e) => {
                        if (
                          option !== "P" &&
                          globalSummaryStats[option] > 0 &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          handleStatusSummaryClick(option);
                        }
                      }}
                    >
                      <p className="text-md font-medium">
                        <span className={`${getStatusColorClass(option)}`}>
                          {option}:
                        </span>
                        <span
                          className={`ml-1 text-lg ${getStatusColorClass(
                            option
                          )}`}
                        >
                          {globalSummaryStats[option]}
                        </span>
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentPage === "history" && (
        <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => handleGoBack("home")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200 ease-in-out font-semibold text-sm"
            >
              ← Voltar
            </button>
            <h1 className="text-center text-3xl font-extrabold text-purple-700 flex-grow">
              Histórico de LEPAS
            </h1>
            <div className="w-24"></div>
          </div>
          {isLoadingHistory ? (
            <p className="text-center text-gray-600">Carregando histórico...</p>
          ) : (
            <div className="space-y-4">
              {/* Seção para o mês atual */}
              {savedLepas.currentMonth.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-blue-700 mb-2 border-b-2 border-blue-200 pb-1">
                    Mês Atual
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {savedLepas.currentMonth.map(renderLepaHistoryItem)}
                  </div>
                </div>
              )}

              {/* Seção para meses passados (Acordeão) */}
              {Object.keys(savedLepas.pastMonths).length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-blue-700 mb-2 mt-6 border-b-2 border-blue-200 pb-1">
                    Meses Anteriores
                  </h2>
                  <div className="space-y-2">
                    {Object.keys(savedLepas.pastMonths).map((monthKey) => (
                      <div
                        key={monthKey}
                        className="rounded-md bg-gray-100 overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedMonth(
                              expandedMonth === monthKey ? null : monthKey
                            )
                          }
                          className="w-full flex justify-between items-center p-3 text-left font-semibold text-gray-800 hover:bg-gray-200 transition-colors"
                        >
                          <span>{monthKey}</span>
                          <span
                            className={`transform transition-transform duration-200 ${
                              expandedMonth === monthKey ? "rotate-180" : ""
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 9l-7 7-7-7"
                              ></path>
                            </svg>
                          </span>
                        </button>
                        {expandedMonth === monthKey && (
                          <div className="p-3 bg-white border-t border-gray-200">
                            <div className="grid grid-cols-1 gap-4">
                              {savedLepas.pastMonths[monthKey].map(
                                renderLepaHistoryItem
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {savedLepas.currentMonth.length === 0 &&
                Object.keys(savedLepas.pastMonths).length === 0 && (
                  <p className="text-center text-gray-600">
                    Nenhum histórico de LEPA encontrado.
                  </p>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
