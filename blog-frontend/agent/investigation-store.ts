import fs from "fs"
import path from "path"

import type { SourceAnalysisDiagnosis } from "@/agent/ai/source-analysis-agent"

console.log(
  "INVESTIGATION STORE LOADED:",
  __filename
)

export type InvestigationHistoryRecord = {
  id: string

  apiPath: string

  createdAt: number

  status: "processing" | "completed" | "failed"

  taskId?: string

  sourceAnalysis?: {
    filePath?: string

    runtime?: {
      duration: number
      status: number
    } | null

    bottleneck?: {
      name: string
      duration: number
      percentage: number
    } | null

    rootCause?: {
      likelyCause: string
      explanation: string
      duration: number
      bottleneckDuration: number
      sourceLines: number[]
    } | null

    developerRecommendation?: {
      priority: "high" | "medium" | "low"
      title: string
      recommendation: string
      reason: string
      sourceLines: number[]
    } | null

    sourceContext?: {
      startLine: number
      endLine: number
      code: string
    } | null
  }

  ai?: SourceAnalysisDiagnosis | null

  error?: string
}

const DATA_FILE = path.resolve(
  process.cwd(),
  "agent",
  "data",
  "investigations.json"
)

const MAX_INVESTIGATIONS = 100

function ensureDataFile() {
  const directory =
    path.dirname(DATA_FILE)

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, {
      recursive: true,
    })
  }

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
      DATA_FILE,
      "[]",
      "utf8"
    )
  }
}

function readInvestigations(): InvestigationHistoryRecord[] {
  ensureDataFile()

  try {
    const content =
      fs.readFileSync(
        DATA_FILE,
        "utf8"
      )

    if (!content.trim()) {
      return []
    }

    const data =
      JSON.parse(content)

    if (!Array.isArray(data)) {
      console.error(
        "Investigation history file must contain an array."
      )

      return []
    }

    return data as InvestigationHistoryRecord[]
  } catch (error) {
    console.error(
      "Failed to read investigation history:",
      error
    )

    return []
  }
}

function writeInvestigations(
  investigations: InvestigationHistoryRecord[]
) {
  ensureDataFile()

  console.log(
    "INVESTIGATION DATA FILE:",
    DATA_FILE
  )

  console.log(
    "INVESTIGATION COUNT TO WRITE:",
    investigations.length
  )

  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      investigations,
      null,
      2
    ),
    "utf8"
  )

  console.log(
    "INVESTIGATION FILE WRITTEN SUCCESSFULLY"
  )
}

export function addInvestigation(
  investigation: InvestigationHistoryRecord
) {
  console.log(
    "ADDING INVESTIGATION:",
    investigation.id
  )

  const investigations =
    readInvestigations()

  console.log(
    "EXISTING INVESTIGATIONS:",
    investigations.length
  )

  investigations.unshift(
    investigation
  )

  const limited =
    investigations.slice(
      0,
      MAX_INVESTIGATIONS
    )

  writeInvestigations(
    limited
  )

  console.log(
    "INVESTIGATION HISTORY SAVED:",
    investigation.id
  )

  return investigation
}

export function getInvestigations() {
  return readInvestigations()
}

export function getInvestigationById(
  id: string
) {
  return readInvestigations().find(
    (investigation) =>
      investigation.id === id
  )
}

export function updateInvestigation(
  id: string,
  updates: Partial<InvestigationHistoryRecord>
) {
  const investigations =
    readInvestigations()

  const index =
    investigations.findIndex(
      (investigation) =>
        investigation.id === id
    )

  if (index === -1) {
    console.error(
      "Investigation not found:",
      id
    )

    return null
  }

  investigations[index] = {
    ...investigations[index],
    ...updates,
  }

  writeInvestigations(
    investigations
  )

  console.log(
    "INVESTIGATION HISTORY UPDATED:",
    id
  )

  return investigations[index]
}

export function clearInvestigations() {
  writeInvestigations([])
}