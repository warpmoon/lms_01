"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./join.module.css";

export default function JoinPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("비밀번호가 일치하지 않습니다.");
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (res.ok) {
        router.push("/login?message=회원가입이 완료되었습니다.");
      } else {
        const data = await res.json();
        setError(data.message || "회원가입에 실패했습니다.");
      }
    } catch (err) {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h1>회원가입</h1>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.inputGroup}>
          <label>이름</label>
          <input name="name" type="text" onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>이메일</label>
          <input name="email" type="email" onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>비밀번호</label>
          <input name="password" type="password" onChange={handleChange} required />
        </div>
        <div className={styles.inputGroup}>
          <label>비밀번호 확인</label>
          <input name="confirmPassword" type="password" onChange={handleChange} required />
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "가입 중..." : "가입하기"}
        </button>
        <div className={styles.links}>
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </div>
      </form>
    </div>
  );
}
