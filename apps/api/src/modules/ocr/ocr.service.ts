import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractTextFromImage(imagePath: string): Promise<string> {
    this.logger.log(`Starting OCR for: ${imagePath}`);
    this.logger.warn('OCR requires tesseract.js integration. Install and configure tesseract.js first.');
    return 'OCR placeholder - integrate tesseract.js for actual text extraction';
  }

  async extractPatientData(ocrText: string): Promise<{
    name?: string;
    phone?: string;
    age?: string;
    address?: string;
    occupation?: string;
    gender?: string;
  }> {
    const data: {
      name?: string;
      phone?: string;
      age?: string;
      address?: string;
      occupation?: string;
      gender?: string;
    } = {};

    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}/g;
    const phoneMatch = ocrText.match(phoneRegex);
    if (phoneMatch) data.phone = phoneMatch[0];

    const ageRegex = /\b(\d{1,2})\s*(yrs?|years?|y\.?o\.?|age)\b/gi;
    const ageMatch = ocrText.match(ageRegex);
    if (ageMatch) data.age = ageMatch[0];

    const lines = ocrText.split('\n').filter((l) => l.trim().length > 3);
    if (lines.length > 0) {
      data.name = lines[0].trim();
    }

    const addressLines = lines.filter(l => /\d/.test(l) && l.length > 10);
    if (addressLines.length > 0) {
      data.address = addressLines.slice(0, 2).join(', ');
    }

    this.logger.log('Patient data extracted from OCR');
    return data;
  }
}