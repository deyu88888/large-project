import { Helmet } from "react-helmet";

interface PageWithTitleProps {
  title: string;
  children: React.ReactNode;
  description?: string;
}

const PageWithTitle = ({
  title,
  children,
  description,
}: PageWithTitleProps) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      {children}
    </>
  );
};

export default PageWithTitle;
