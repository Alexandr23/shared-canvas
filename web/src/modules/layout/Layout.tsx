import React from "react";

import styles from "./Layout.module.css";

type LayoutProps = {
  header: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ header, body, footer }) => {
  return (
    <div className={styles.layout}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>{body}</div>
      <div className={styles.footer}>{footer}</div>
    </div>
  );
};
