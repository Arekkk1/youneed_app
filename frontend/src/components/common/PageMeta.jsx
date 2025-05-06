import { Helmet } from "react-helmet-async"; // Keep only Helmet import

const PageMeta = ({ title, description }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {/* You can add more meta tags here if needed */}
  </Helmet>
);

// Remove the AppWrapper export as HelmetProvider is now at the root
// export const AppWrapper = ({ children }) => (
//   <HelmetProvider>{children}</HelmetProvider>
// );

export default PageMeta;
