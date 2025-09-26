export function selectFnbTranslationSource(extraction: any): any {
  return extraction?.product_initial_language ?? extraction
}

export function mapFnbResults(params: {
  extraction: any
  translation: any
}): Record<string, any> {
  return {
    fnb_extraction: params.extraction ?? null,
    fnb_translation: params.translation ?? null,
  }
}
