"use client";

import { useEffect, useRef, useState } from "react";
import type { Font } from "opentype.js";
import {
  PNG_EXPORT_SIZES,
  downloadBlob,
  exportPng,
  sanitizeFilename,
  type ExportPhase,
} from "../export/png-export";
import { exportGif } from "../export/gif-export";
import type { AnyEffectDefinition } from "../effects/types";

type ExportFormat = "png" | "gif";

const THUMBNAIL_DISPLAY_MS = 3000;

interface ExportPanelProps {
  font: Font | null;
  text: string;
  effect: AnyEffectDefinition;
  params: Record<string, unknown>;
}

// canvas.toBlob()은 브라우저가 세부 인코딩 퍼센트를 노출하지 않는다
// — 그래서 실제 진행률 대신, 코드가 실제로 통과하는 체크포인트에
// 각각 목표 지점을 대응시킨다. 체크포인트 사이의 시각적 보간에는
// CSS transition을 쓰지만(급하게 점프하는 대신 부드럽게 따라잡게),
// 목표값 자체는 전부 실제 신호에서 온다 — 타이머로 지어낸 가짜
// 퍼센트가 아니다.
const PHASE_PROGRESS: Record<ExportPhase, number> = {
  preparing: 0.15,
  rendering: 0.4,
  encoding: 0.75,
  done: 1,
};

const PHASE_LABEL: Record<ExportPhase, string> = {
  preparing: "준비 중",
  rendering: "렌더링 중",
  encoding: "인코딩 중",
  done: "완료",
};

export function ExportPanel({ font, text, effect, params }: ExportPanelProps) {
  const [sizeId, setSizeId] = useState(PNG_EXPORT_SIZES[0].id);
  const [phase, setPhase] = useState<ExportPhase | null>(null);
  // PNG/GIF 버튼 중 어느 쪽이 지금 내보내는 중인지 — phase 하나만으로는
  // 두 버튼 중 어디에 라벨을 표시할지 구분할 수 없어 별도로 둔다.
  // 두 export는 동시에 실행되지 않는다(phase가 겹치면 아래 disabled로
  // 서로를 막는다).
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  // 마지막 내보내기가 실패한 포맷 — 버튼은 다시 눌러 재시도할 수 있으니
  // 따로 다시 시도 버튼을 두지 않고, 무엇이 실패했는지만 알린다.
  const [failedFormat, setFailedFormat] = useState<ExportFormat | null>(null);
  const thumbnailUrlRef = useRef<string | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearThumbnail() {
    if (dismissTimerRef.current !== null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (thumbnailUrlRef.current) {
      URL.revokeObjectURL(thumbnailUrlRef.current);
      thumbnailUrlRef.current = null;
    }
    setThumbnailUrl(null);
  }

  // 언마운트 시 마지막으로 만든 오브젝트 URL을 정리한다(메모리 누수 방지).
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current !== null) clearTimeout(dismissTimerRef.current);
      if (thumbnailUrlRef.current) URL.revokeObjectURL(thumbnailUrlRef.current);
    };
  }, []);

  function showThumbnail(blob: Blob) {
    // 일반 토스트 대신, 실제로 방금 내보낸 결과를 작은 썸네일로
    // 보여준다 — export 파이프라인 자체가 이 제품의 가치 제안이라
    // "완료됐다"는 텍스트보다 결과물 그 자체를 순간의 확인으로
    // 삼는다. <img>는 GIF도 그대로 재생하므로 애니메이션 확인도 된다.
    const url = URL.createObjectURL(blob);
    thumbnailUrlRef.current = url;
    setThumbnailUrl(url);
    dismissTimerRef.current = setTimeout(() => {
      if (thumbnailUrlRef.current === url) clearThumbnail();
    }, THUMBNAIL_DISPLAY_MS);
  }

  async function handleExportPng() {
    if (!font || !text) return;
    const size =
      PNG_EXPORT_SIZES.find((s) => s.id === sizeId) ?? PNG_EXPORT_SIZES[0];
    clearThumbnail();
    setFailedFormat(null);
    setExportingFormat("png");
    setPhase("preparing");
    try {
      const blob = await exportPng(font, text, effect, params, size, setPhase);
      downloadBlob(blob, `${sanitizeFilename(text)}-${effect.id}.png`);
      showThumbnail(blob);
    } catch (err) {
      // 실패를 삼키지 않고 콘솔에 남기되, 사용자에게도 문구로 알린다.
      console.error(err);
      setFailedFormat("png");
    } finally {
      setPhase(null);
      setExportingFormat(null);
    }
  }

  async function handleExportGif() {
    if (!font || !text) return;
    clearThumbnail();
    setFailedFormat(null);
    setExportingFormat("gif");
    setPhase("preparing");
    try {
      const blob = await exportGif(font, text, effect, params, setPhase);
      downloadBlob(blob, `${sanitizeFilename(text)}-${effect.id}.gif`);
      showThumbnail(blob);
    } catch (err) {
      // 실패를 삼키지 않고 콘솔에 남기되, 사용자에게도 문구로 알린다.
      console.error(err);
      setFailedFormat("gif");
    } finally {
      setPhase(null);
      setExportingFormat(null);
    }
  }

  const exporting = phase !== null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sizeId}
          onChange={(e) => setSizeId(e.target.value)}
          className="border border-mist bg-paper px-3 py-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          {PNG_EXPORT_SIZES.map((size) => (
            <option key={size.id} value={size.id}>
              {size.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleExportPng}
          disabled={!font || !text || exporting}
          className="border border-ink bg-ink px-4 py-2 text-sm text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-default disabled:opacity-40"
        >
          {exporting && exportingFormat === "png"
            ? (PHASE_LABEL[phase] ?? "내보내는 중")
            : "PNG 다운로드"}
        </button>
        <button
          type="button"
          onClick={handleExportGif}
          disabled={!font || !text || exporting}
          className="border border-mist px-4 py-2 text-sm text-ink transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-default disabled:opacity-40"
        >
          {exporting && exportingFormat === "gif"
            ? (PHASE_LABEL[phase] ?? "내보내는 중")
            : "GIF 다운로드"}
        </button>
        {thumbnailUrl && (
          // 방금 내보낸 blob의 임시 object URL이라 next/image 최적화
          // 대상이 아니다(원격/정적 자산이 아님).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={thumbnailUrl}
            src={thumbnailUrl}
            alt="방금 내보낸 이미지"
            className="h-10 w-10 border border-mist object-cover"
            style={{
              animationName: "export-thumbnail-scale-in",
              animationDuration: "250ms",
              animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
              animationFillMode: "both",
            }}
          />
        )}
      </div>
      {/* 폰트 로드 실패 문구와 같은 방식 — live region 안의 문구는
          상태가 있을 때만 넣는다. */}
      <p role="status" aria-live="polite" className="text-xs text-graphite">
        {failedFormat
          ? `${failedFormat.toUpperCase()} 내보내기에 실패했어요. 다시 눌러 주세요.`
          : ""}
      </p>
      <div
        role="progressbar"
        aria-hidden={!exporting}
        aria-valuenow={exporting ? Math.round(PHASE_PROGRESS[phase] * 100) : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        className={`h-0.5 w-full max-w-48 bg-mist transition-opacity duration-150 ${
          exporting ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="h-full bg-signal transition-[width] duration-200 ease-out"
          style={{ width: `${(exporting ? PHASE_PROGRESS[phase] : 0) * 100}%` }}
        />
      </div>
    </div>
  );
}
