export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    console.log(
      `Translate text: "${text.substring(0, 30)}..."，target language: ${targetLanguage}`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/translate/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.translated_text) {
      return data.translated_text;
    }

    console.warn(`Lack of translation result`);
    return text;
  } catch (error) {
    console.error(`Translation request failed:`, error);
    return text;
  }
};

export const translateBatch = async (
  texts: string[],
  targetLanguage: string
): Promise<Record<string, string>> => {
  if (!texts || texts.length === 0) {
    return {};
  }

  try {
    console.log(`Batch translate ${texts.length} texts, target language: ${targetLanguage}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/translate/batch/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        target_language: targetLanguage,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.translations) {
      console.log(
        `Batch translate success, received ${Object.keys(data.translations).length} results`
      );
      return data.translations;
    }

    console.warn(`Batch translate response lacks translation results`);
    return texts.reduce(
      (acc, text) => {
        acc[text] = text;
        return acc;
      },
      {} as Record<string, string>
    );
  } catch (error) {
    console.error(`Batch translate request failed:`, error);

    return texts.reduce(
      (acc, text) => {
        acc[text] = text;
        return acc;
      },
      {} as Record<string, string>
    );
  }
};
