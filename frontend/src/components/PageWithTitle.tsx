import { useEffect } from "react";

interface PageWithTitleProps {
  title: string;
  children: React.ReactNode;
}

const PageWithTitle = ({ title, children }: PageWithTitleProps) => {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return <>{children}</>;
};

export default PageWithTitle;