"use client";

import { useEffect, useRef, useState } from "react";
import { updateProgress } from "@/app/classroom/[courseId]/[lessonId]/actions";

interface VideoPlayerProps {
  lessonId: string;
  videoUrl: string;
  initialPosition: number;
}

export default function VideoPlayer({ lessonId, videoUrl, initialPosition }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 초기 위치로 이동
    video.currentTime = initialPosition;

    const handleTimeUpdate = () => {
      // 10초마다 또는 특정 간격으로 진도율 저장 가능 (여기선 5초 주기)
      if (Math.floor(video.currentTime) % 5 === 0) {
        saveProgress();
      }
    };

    const handleEnded = () => {
      setIsCompleted(true);
      saveProgress(true);
    };

    const saveProgress = async (completed = false) => {
      try {
        await updateProgress(lessonId, Math.floor(video.currentTime), completed || isCompleted);
      } catch (error) {
        console.error("Failed to save progress", error);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      // 종료 시 현재 위치 저장
      saveProgress();
    };
  }, [lessonId, initialPosition, isCompleted]);

  return (
    <div style={{ width: "100%", aspectRatio: "16/9", background: "#000", borderRadius: "8px", overflow: "hidden" }}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
