"use client";

import { useEffect, useState } from "react";
import { Spin } from "antd";
import { useAppSelector, useAppDispatch } from "@/store";

export default function Page() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === "undefined") return;
      if (accessToken) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    };

    const timeout = setTimeout(() => {
      checkAuth();
    }, 100);

    return () => clearTimeout(timeout);
  }, [accessToken, dispatch]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[rgb(245,247,250)]">
      <div className="text-center">
        <Spin size="large" />
        <div className="mt-4">
          {/* <p className="text-gray-600">Проверка статуса авторизации...</p> */}
        </div>
      </div>
    </div>
  );
}
