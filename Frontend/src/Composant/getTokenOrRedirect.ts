// @ts-nocheck
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

// utils/getTokenOrRedirect.js
const GetTokenOrRedirect = () => {
    const history = useHistory();

  const token = localStorage.getItem("token");
  if (!token) {
    history("/archive/") ;
    return null;
  }
  return token;
};

export default GetTokenOrRedirect;
