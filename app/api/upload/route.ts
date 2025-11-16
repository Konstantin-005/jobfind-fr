import { writeFile, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 5MB max file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'application/pdf'];
const ALLOWED_FOLDERS = ['companyLogo', 'photo'] as const;
type AllowedFolder = typeof ALLOWED_FOLDERS[number];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = (formData.get('folder') as string | null) || 'companyLogo';
    const folder: AllowedFolder = (ALLOWED_FOLDERS.includes(requestedFolder as AllowedFolder)
      ? (requestedFolder as AllowedFolder)
      : 'companyLogo');

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый тип файла. Разрешены: JPEG, PNG, SVG, PDF' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Файл слишком большой. Максимальный размер: 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate UUID for filename
    const fileExt = path.extname(file.name);
    const fileUuid = uuidv4();
    const fileName = `${fileUuid}${fileExt}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', folder);
    const filePath = path.join(uploadsDir, fileName);

    try {
      // Ensure uploads directory exists
      await mkdir(uploadsDir, { recursive: true });
      await writeFile(filePath, buffer);

      return NextResponse.json({ 
        success: true,
        filePath: `/uploads/${folder}/${fileName}`,
        fileName,
        originalName: file.name,
        uuid: fileUuid,
        size: file.size,
        mimeType: file.type
      });
    } catch (error) {
      console.error('Ошибка при сохранении файла:', error);
      return NextResponse.json(
        { error: 'Ошибка при сохранении файла' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
