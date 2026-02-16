export type BulkMoveRequest =
  | { messageIds: string[]; categoryId: string; batchSize?: number; concurrency?: number; dryRun?: boolean }
  | { messageIds: string[]; categoryId: string[]; batchSize?: number; concurrency?: number; dryRun?: boolean }
  | { messageIds: string[]; dryRun?: boolean; minConfidence?: number; batchSize?: number; concurrency?: number }

export type BulkMoveMode = 'single' | 'mapping' | 'predictive'

export type BulkMoveResult = {
  messageId: string
  ok: boolean
  status?: number
  error?: string
  reason?: string
  predictedCategoryId?: string
  destinationFolderId?: string
}

export type BulkMoveResponse = {
  success: true
  data: {
    mode: BulkMoveMode
    dryRun?: boolean
    minConfidence?: number
    categoryId?: string
    planned?: { destinationFolderId: string; count: number; messageIds: string[] }
    results: BulkMoveResult[]
  }
}


