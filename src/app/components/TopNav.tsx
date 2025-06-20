"use client";

import "./TopNav.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { useRouter } from "next/navigation";

interface Notification {
  from: string;
  type: string;
  timestamp?: Timestamp;
}

export default function TopNav() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const router = useRouter();

  // 로그인 상태 확인 및 알림 불러오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
          alert("프로필 정보가 존재하지 않습니다. 회원가입 후 이용해주세요.");
          return;
        }
        

        const data = docSnap.data();
        setNotifications(data.notifications || []);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm("로그아웃하시겠습니까?");
    if (!confirmLogout) return;

    try {
      await signOut(auth);
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  return (
    <header className="topnav">
      <Link href="/">
        <h1 className="logo">Quokka</h1>
      </Link>

      <div className="nav-actions">
        {user && (
          <div className="notification-wrapper">
            <button
              className="alert-btn"
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              🔔 알림
            </button>
            {showNotifications && (
              <div className="notification-box">
                {notifications.length > 0 ? (
                  notifications.map((noti, index) => (
                    <div key={index} className="notification-item">
                      {noti.type === "like"
                        ? `❤️ ${noti.from} 님이 당신을 좋아합니다`
                        : `⚠️ ${noti.from} 님이 탈퇴하였습니다`}
                    </div>
                  ))
                ) : (
                  <div className="notification-empty">아직 알림이 없습니다</div>
                )}
              </div>
            )}
          </div>
        )}

        {!isLoading &&
          (user ? (
            <button onClick={handleLogout} className="auth-btn">
              로그아웃
            </button>
          ) : (
            <button onClick={() => router.push("/login")} className="auth-btn">
              로그인
            </button>
          ))}
      </div>
    </header>
  );
}
