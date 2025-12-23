/**
 * @file: page.tsx
 * @description: Страница настроек аккаунта: изменение контактных данных и смена пароля.
 * @dependencies: app/utils/api.ts (usersApi), next/navigation
 * @created: 2025-12-16
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usersApi, type UpdateUserProfilePayload, type UserProfile } from "../utils/api";

type AlertState = {
  type: "success" | "error";
  text: string;
} | null;

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [contactsEmail, setContactsEmail] = useState("");
  const [phoneDigitsAfter7, setPhoneDigitsAfter7] = useState("");
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsAlert, setContactsAlert] = useState<AlertState>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState<AlertState>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  const ensureCaretAfterPrefix = () => {
    const input = phoneInputRef.current;
    if (!input) return;
    const prefixLength = 2;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (start < prefixLength || end < prefixLength) {
      input.setSelectionRange(prefixLength, prefixLength);
    }
  };

  const normalizePhoneAfter7 = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";

    const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
    const after7 = normalized.startsWith("7") ? normalized.slice(1) : normalized;
    return after7.slice(0, 10);
  };

  const formatPhone = (digitsAfter7: string) => {
    const d = digitsAfter7.replace(/\D/g, "").slice(0, 10);

    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 8);
    const e = d.slice(8, 10);

    let result = "+7";
    if (a.length) result += ` ${a}`;
    if (b.length) result += ` ${b}`;
    if (c.length) result += `-${c}`;
    if (e.length) result += `-${e}`;
    return result;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      const returnUrl = searchParams.get("from") || "/settings";
      router.push(`/login?from=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setAuthorized(true);
    setLoading(false);
  }, [router, searchParams]);

  useEffect(() => {
    if (!authorized) return;

    const load = async () => {
      setLoading(true);
      const res = await usersApi.getProfile();

      if (res.error) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user_type");
          router.push("/login?from=%2Fsettings");
          return;
        }

        setContactsAlert({ type: "error", text: res.error });
        setPasswordAlert({ type: "error", text: res.error });
        setLoading(false);
        return;
      }

      if (res.data) {
        setProfile(res.data);
        setContactsEmail(res.data.email || "");
        setPhoneDigitsAfter7(normalizePhoneAfter7(res.data.phone_number || ""));
      }

      setLoading(false);
    };

    void load();
  }, [authorized, router]);

  const contactsHasChanges = useMemo(() => {
    if (!profile) return false;

    const emailChanged = contactsEmail !== (profile.email || "");
    const currentAfter7 = normalizePhoneAfter7(profile.phone_number || "");
    const phoneChanged = phoneDigitsAfter7 !== currentAfter7;

    // Не считаем "очистку" валидным изменением без явного согласования.
    // Если поле стало пустым, не отправляем его вообще.
    const emailMeaningfulChange = emailChanged && contactsEmail.trim() !== "";
    const phoneMeaningfulChange = phoneChanged && phoneDigitsAfter7.trim() !== "";

    return emailMeaningfulChange || phoneMeaningfulChange;
  }, [contactsEmail, phoneDigitsAfter7, profile]);

  const buildContactsPayload = (): UpdateUserProfilePayload => {
    if (!profile) return {};

    const payload: UpdateUserProfilePayload = {};

    if (contactsEmail !== (profile.email || "") && contactsEmail.trim() !== "") {
      payload.email = contactsEmail.trim();
    }

    const currentAfter7 = normalizePhoneAfter7(profile.phone_number || "");
    if (phoneDigitsAfter7 !== currentAfter7 && phoneDigitsAfter7.trim() !== "") {
      payload.phone_number = `7${phoneDigitsAfter7.replace(/\D/g, "")}`;
    }

    return payload;
  };

  const handleContactsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactsAlert(null);

    const payload = buildContactsPayload();

    if (Object.keys(payload).length === 0) {
      setContactsAlert({ type: "error", text: "Нет изменений для сохранения." });
      return;
    }

    if (payload.phone_number && payload.phone_number.replace(/\D/g, "").length !== 11) {
      setContactsAlert({ type: "error", text: "Введите номер телефона в формате +7 xxx xxx-xx-xx" });
      return;
    }

    setContactsLoading(true);
    const res = await usersApi.updateProfile(payload);
    setContactsLoading(false);

    if (res.error) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user_type");
        router.push("/login?from=%2Fsettings");
        return;
      }

      setContactsAlert({ type: "error", text: res.error });
      return;
    }

    if (res.data) {
      setProfile(res.data);
      setContactsEmail(res.data.email || "");
      setPhoneDigitsAfter7(normalizePhoneAfter7(res.data.phone_number || ""));
    }

    setContactsAlert({ type: "success", text: "Контактные данные обновлены." });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordAlert(null);
    setCurrentPasswordError(null);

    if (!newPassword.trim()) {
      setPasswordAlert({ type: "error", text: "Введите новый пароль." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordAlert({ type: "error", text: "Новый пароль должен быть не короче 8 символов." });
      return;
    }

    if (newPasswordConfirm !== newPassword) {
      setPasswordAlert({ type: "error", text: "Подтверждение пароля не совпадает." });
      return;
    }

    if (!currentPassword.trim()) {
      setCurrentPasswordError("Введите текущий пароль.");
      return;
    }

    const payload: UpdateUserProfilePayload = {
      password: newPassword,
      currentPassword: currentPassword,
    };

    setPasswordLoading(true);
    const res = await usersApi.updateProfile(payload);
    setPasswordLoading(false);

    if (res.error) {
      if (res.status === 401) {
        // По вашей логике 401 может означать как отсутствие авторизации, так и неверный текущий пароль.
        // Различаем по тексту сообщения.
        if (res.error.toLowerCase().includes("неверный текущий пароль")) {
          setCurrentPasswordError(res.error);
          return;
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user_type");
        router.push("/login?from=%2Fsettings");
        return;
      }

      setPasswordAlert({ type: "error", text: res.error });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");

    setPasswordAlert({ type: "success", text: "Пароль обновлён." });
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Загрузка...</div>;
  }

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <h1 className="text-lg font-semibold text-gray-900">Настройки аккаунта</h1>
            <p className="text-sm text-gray-500 mt-1">Изменение контактных данных и пароля</p>
          </div>

          <div className="px-6 py-6">
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Контактные данные</h2>
                  <p className="text-sm text-gray-500">Email и телефон можно изменить без ввода текущего пароля.</p>
                </div>

                <form onSubmit={handleContactsSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={contactsEmail}
                        onChange={(e) => setContactsEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="user@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        inputMode="tel"
                        value={formatPhone(phoneDigitsAfter7)}
                        onChange={(e) => setPhoneDigitsAfter7(normalizePhoneAfter7(e.target.value))}
                        onFocus={ensureCaretAfterPrefix}
                        onClick={ensureCaretAfterPrefix}
                        onSelect={ensureCaretAfterPrefix}
                        onKeyDown={(e) => {
                          if (e.key !== "ArrowLeft" && e.key !== "Backspace" && e.key !== "Home") return;
                          const input = e.currentTarget;
                          const prefixLength = 2;
                          const start = input.selectionStart ?? 0;
                          const end = input.selectionEnd ?? 0;
                          if (start <= prefixLength && end <= prefixLength) {
                            e.preventDefault();
                            input.setSelectionRange(prefixLength, prefixLength);
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+7 999 123-45-67"
                      />
                    </div>
                  </div>

                  {contactsAlert && (
                    <div
                      className={
                        contactsAlert.type === "success"
                          ? "text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                          : "text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                      }
                    >
                      {contactsAlert.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={!contactsHasChanges || contactsLoading}
                      className={
                        !contactsHasChanges || contactsLoading
                          ? "px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    >
                      {contactsLoading ? "Сохранение..." : "Сохранить"}
                    </button>
                  </div>
                </form>
              </section>

              <div className="border-t border-gray-100" />

              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Смена пароля</h2>
                  <p className="text-sm text-gray-500">Для смены пароля требуется текущий пароль.</p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (currentPasswordError) setCurrentPasswordError(null);
                        }}
                        className={
                          currentPasswordError
                            ? "w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            : "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        }
                        placeholder="Введите текущий пароль"
                      />
                      {currentPasswordError && <p className="mt-1 text-sm text-red-600">{currentPasswordError}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Новый пароль"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
                      <input
                        type="password"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Повторите новый пароль"
                      />
                    </div>
                  </div>

                  {passwordAlert && (
                    <div
                      className={
                        passwordAlert.type === "success"
                          ? "text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                          : "text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                      }
                    >
                      {passwordAlert.text}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className={
                        passwordLoading
                          ? "px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    >
                      {passwordLoading ? "Сохранение..." : "Обновить пароль"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
