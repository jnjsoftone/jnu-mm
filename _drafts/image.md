import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import exifr from "exifr";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zipPath = searchParams.get("path");
    const entryPath = searchParams.get("entry");

    if (!zipPath || !entryPath) {
      return NextResponse.json(
        { error: "ZIP 파일 경로와 파일 경로가 필요합니다." },
        { status: 400 }
      );
    }

    // ZIP 파일이 존재하는지 확인
    if (!fs.existsSync(zipPath)) {
      return NextResponse.json(
        { error: "ZIP 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const zip = new AdmZip(zipPath);
    const entry = zip.getEntry(entryPath);

    if (!entry) {
      return NextResponse.json(
        { error: "ZIP 파일 내에서 해당 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미지 파일의 데이터를 Buffer로 추출
    const buffer = entry.getData();

    // EXIF 데이터 추출
    const metadata = await exifr.parse(buffer, {
      // GPS 정보 포함
      gps: true,
      // 이미지 크기 정보 포함
      ifd0: true,
      // 상세 정보 포함
      exif: true,
      tiff: false,
      interop: false,
      thumb: false,
      xmp: false,
      iptc: false,
      jfif: false,
      ihdr: false,
    });

    // 메타데이터 가공
    const result = {
      dimensions: {
        width: metadata?.ImageWidth,
        height: metadata?.ImageHeight,
      },
      takenAt: metadata?.DateTimeOriginal || metadata?.CreateDate,
      location: metadata?.latitude && metadata?.longitude
        ? {
            latitude: metadata.latitude,
            longitude: metadata.longitude,
          }
        : undefined,
      camera: {
        make: metadata?.Make,
        model: metadata?.Model,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error extracting metadata from ZIP file:", error);
    return NextResponse.json(
      { error: "메타데이터 추출 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 