export interface LegalSection {
  id: string
  title: string
  body: string
}

export interface LegalDocument {
  title: string
  description: string
  lastUpdated: string
  contactEmail: string
  sections: LegalSection[]
}
