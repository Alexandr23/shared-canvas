import React from "react";

import { useStore } from "../store";

import styles from "./Header.module.css";

type HeaderProps = {};

export const Header: React.FC<HeaderProps> = () => {
  const users = useStore((state) => state.users);
  const user = useStore((state) => state.user);

  const otherUsers = React.useMemo(() => {
    return users.filter((u) => u.id !== user?.id);
  }, [users, user]);

  return (
    <div className={styles.header}>
      <div className={styles.user} style={{ backgroundColor: user?.color }} />
      <div className={styles.name}>{user?.name}</div>
      <div className={styles.otherUsers}>
        {otherUsers.map((user) => {
          return (
            <div
              key={user.id}
              className={styles.user}
              style={{ backgroundColor: user?.color }}
            />
          );
        })}
      </div>
    </div>
  );
};
