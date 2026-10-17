import QueryProvider from "./QueryProvider";
import ThemeProvider from "./ThemeProvider";
import AuthProvider from "./AuthProvider";

export default function Providers({ children }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}