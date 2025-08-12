export const toGraphV2Id = (ewsId: string): string => {
  try {
    if (window.Office?.context?.mailbox?.convertToRestId) {
      const v = (window.Office as any).MailboxEnums?.RestVersion?.v2_0 || 'v2.0'
      return window.Office.context.mailbox.convertToRestId(ewsId, v)
    }
  } catch {}
  return ewsId
}

