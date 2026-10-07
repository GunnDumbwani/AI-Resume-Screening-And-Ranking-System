import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Initialize PDF.js worker using local Vite bundled asset URL
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  } catch (e) {
    console.warn('Could not initialize local pdfjs worker URL, fallback to inline', e);
  }
}

export interface ParseResult {
  success: boolean;
  text: string;
  error?: string;
  filename: string;
}

export async function parseResumeFile(file: File): Promise<ParseResult> {
  const filename = file.name;
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  try {
    if (extension === 'pdf') {
      return await parsePdfFile(file);
    } else if (extension === 'docx') {
      return await parseDocxFile(file);
    } else if (extension === 'txt' || extension === 'md') {
      const text = await file.text();
      if (!text.trim()) {
        return {
          success: false,
          text: '',
          error: 'File is completely empty (0 characters).',
          filename
        };
      }
      return { success: true, text, filename };
    } else {
      return {
        success: false,
        text: '',
        error: `Unsupported file format (.${extension}). Please upload PDF or DOCX files.`,
        filename
      };
    }
  } catch (err: any) {
    return {
      success: false,
      text: '',
      error: `Failed to extract file text: ${err?.message || 'Corrupted or unreadable format'}`,
      filename
    };
  }
}

async function parsePdfFile(file: File): Promise<ParseResult> {
  const filename = file.name;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const typedArray = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: typedArray,
      useSystemFonts: true,
    });

    // Generous 15-second timeout for large, graphics-heavy, or multi-page resumes
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('PDF extraction timed out after 15 seconds')), 15000)
    );

    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      let lastY: number | null = null;
      let pageText = '';
      
      for (const item of (content.items as any[])) {
        if (!item || typeof item.str !== 'string') continue;
        const str = item.str;
        if (!str) continue;
        
        const currentY = item.transform && Array.isArray(item.transform) ? item.transform[5] : null;
        
        // If Y-coordinate shifted significantly, insert line break
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n') && !str.startsWith(' ')) {
          pageText += ' ';
        }
        
        pageText += str;
        if (currentY !== null) {
          lastY = currentY;
        }
      }
      
      fullText += pageText + '\n\n';
    }

    const trimmed = fullText.trim();
    if (trimmed.length < 20) {
      return {
        success: false,
        text: trimmed,
        error: 'Scanned or image-only PDF: No extractable text layer detected. OCR required.',
        filename
      };
    }

    return {
      success: true,
      text: fullText,
      filename
    };
  } catch (err: any) {
    if (err?.name === 'PasswordException') {
      return {
        success: false,
        text: '',
        error: 'Password protected PDF. Unable to extract contents.',
        filename
      };
    }
    return {
      success: false,
      text: '',
      error: `PDF extraction error: ${err?.message || 'Unreadable PDF structure'}`,
      filename
    };
  }
}

async function parseDocxFile(file: File): Promise<ParseResult> {
  const filename = file.name;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value.trim();

    if (text.length < 20) {
      return {
        success: false,
        text,
        error: 'DOCX file contains insufficient text (< 20 characters).',
        filename
      };
    }

    return {
      success: true,
      text,
      filename
    };
  } catch (err: any) {
    return {
      success: false,
      text: '',
      error: `DOCX extraction error: ${err?.message || 'Corrupted DOCX archive'}`,
      filename
    };
  }
}
