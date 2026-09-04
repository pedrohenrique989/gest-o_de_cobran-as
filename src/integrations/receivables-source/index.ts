import "server-only";
import { googleSheetsLegacyAdapter } from "./googleSheetsLegacyAdapter";
import { financialDatabaseAdapter } from "./financialDatabaseAdapter";
/** PONTO DE TROCA: quando a base financeira substituir o Sheets, mude aqui (ou via env RECEIVABLES_SOURCE). */
export const receivablesSource = process.env.RECEIVABLES_SOURCE === "financial_database" ? financialDatabaseAdapter : googleSheetsLegacyAdapter;
export type { ReceivablesSourceAdapter } from "./types";
