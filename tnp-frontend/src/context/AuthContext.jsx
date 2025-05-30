// import { createContext, useContext, useEffect, useState } from "react";
// import axios from "../api/axios";
// import { useNavigate } from "react-router-dom";

// const AuthContext = createContext({});

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [errors, setErrors] = useState([]);
//   const [fabrics, setFabrics] = useState([]);
//   const navigate = useNavigate();

//   // const csrf = () => axios.get("/sanctum/csrf-cookie");

//   const fetchFabrics = async (pattern_id) => {
//     const response = await axios.get(`http://localhost:8000/api/costFabric/${pattern_id}`);

//     setFabrics(response.data);
//   };

//   const getUser = async () => {
//     const { data } = await axios.get("/api/user");
//     setUser(data);
//   };

//   // const login = async ({ ...data }) => {
//   //   await csrf();
//   //   setErrors([]);
//   //   try {
//   //     await axios.post("/login", data);
//   //     await getUser();
//   //     navigate("/");
//   //   } catch (e) {
//   //     if (e.response.status === 422) {
//   //       setErrors(e.response.data.errors);
//   //     }
//   //   }
//   // };

//   const login = async ({ ...data }) => {
//     try {
//       await axios.post("/login", data);
//       // await getUser();
//       navigate("/");
//     } catch (e) {
//       if (e.response.status === 422) {
//         setErrors(e.response.data.errors);
//       }
//     }
//   };

//   const register = async ({ ...data }) => {
//     await csrf();
//     setErrors([]);
//     try {
//       await axios.post("/register", data);
//       await getUser();
//       navigate("/");
//     } catch (e) {
//       if (e.response.status === 422) {
//         setErrors(e.response.data.errors);
//       }
//     }
//   };

//   const logout = () => {

//     localStorage.clear();
//     navigate("/login");

//     // await axios.post("/logout").then(() => {
//     //   setUser(null);
//     // });
//   };

//   const updateProduction = async ({ ...data }) => {

//     const { productionType, id } = data;

//     console.log(data);

//     // await axios.put(`http://localhost:8000/api/production/${id}`, production_type).then( () => {
      
//     //  console.log(data.message); 
     
//     // }).catch(({ response }) => {

//     //   console.log(response.data.message); 
//     // })

//   };

//   useEffect(() => {
//     if (!user) {
//       getUser();
//     }
//   }, []);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         errors,
//         getUser,
//         login,
//         register,
//         logout,
//         updateProduction,
//         fetchFabrics,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default function useAuthContext() {
//   return useContext(AuthContext);
// }
