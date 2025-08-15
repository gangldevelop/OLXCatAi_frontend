export type EmailMessage = {
  id: string
  subject: string
  sender: string
  body: string
  receivedDate: string
  isRead?: boolean
  categories?: string[]
}

export type CategoryPrediction = {
  categoryId: string
  confidence: number
}

export type BackendRecipient = {
  emailAddress: { address: string; name: string }
}

export type BackendEmailBody = {
  content: string
  contentType: 'text' | 'html'
}

export type BackendEmailMessage = {
  id: string
  subject: string
  body: BackendEmailBody
  from: BackendRecipient
  toRecipients: BackendRecipient[]
  receivedDateTime: string
  isRead: boolean
  categories: string[]
  parentFolderId?: string
}

