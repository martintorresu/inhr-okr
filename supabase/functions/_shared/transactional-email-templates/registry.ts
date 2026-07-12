import * as React from 'npm:react@18.3.1'

// Shape every template file must satisfy.
export interface TemplateEntry {
  component: (props: any) => React.ReactElement
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

import { template as okrInvite } from './okr-invite.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'okr-invite': okrInvite,
}
