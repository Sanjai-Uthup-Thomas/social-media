import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import { PrivateRoutes } from "./PrivateRoutes";
import { useDispatch, useSelector } from "react-redux";
import HomePage from '../pages/user/HomePage';
import Login from '../components/user/login/login';
import SignUp from '../components/user/signup/signup';
import SignupOTP from '../components/user/signupOTP/signupOTP';
import AdminLogin from '../components/admin/login/adminLogin';
import { PrivateAdmin } from './AdminPrivate';
import AdminDash from '../pages/admin/dash/dash';
import User from '../pages/admin/user/user';
import Post from '../pages/admin/post/post';
import UserProfile from '../pages/user/UserProfile';
import { checkToken, getUserNames } from '../api/userApi';
import { useState } from 'react';
import EditProfile from '../pages/user/EditProfile';
import { control, logout, socketUpdate } from '../features/auth/authSlice';
import Chat from '../pages/user/Chat';
import Notifications from '../pages/user/Notifications';
import Suggestions from '../pages/user/Suggestions';
import ForgetPassword from '../components/user/login/forgetPassword';
function NavRoutes() {
    

    const {
        auth: { token, admin_token, signup,controlState,socket }
    } = useSelector(state => state)
    const userParse = localStorage.getItem("user")
    const  user= JSON.parse(userParse)
    const dispatch = useDispatch()
    useEffect(() => {
        const socketio = require('socket.io-client')("ws://localhost:3001")
        socketio?.emit("addUser", user?.id)
        console.log(user?.id,"addUser");
        socketio.on("getUser", users => {
            console.log(users,"users"); 
            console.log(socketio?.id,"socketid");
          dispatch(socketUpdate(socketio)) 
        })
      }, [user?.id])
    //   useEffect(()=>{
    //     dispatch(control())

    //   },[])

    const [userName, setUserName] = useState([])
    if (user) {
        if (!signup) {
            
                var users = user
            
        }
    }
    const userToken = localStorage.getItem('token')
    useEffect(() => {
        // checkToken().then((response) => {
        // }).catch((error) => {
        //     // console.log(error);
        //     // dispatch(logout())
        // })
        fetchData()

    }, [user?.id])

    const fetchData = async () => {
        // console.log("fetchData", user);
        if (user) {
            let result = await getUserNames()
            if (result) {
                // console.log(result.data)
                setUserName(result.data)
            }


        }

    }



    return (
        <Router>
            <Routes>
                {token ? (
                    <>
                        <Route path="/" element={<Navigate to="/Home" replace />} />
                        <Route path="/signup" element={<Navigate to="/Home" replace />} />
                        <Route path="/OTPverification" element={<Navigate to="/Home" replace />} />
                    </>
                ) : (
                    <>
                        <Route path="/" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/OTPverification" element={<SignupOTP />} />
                        <Route path="/forgetpassword" element={<ForgetPassword/>} />
                         {/* <Route path="/home" element={<HomePage />} /> */}
                    </>
                )}
                <Route element={<PrivateRoutes />}>
                    <Route path="/home" element={<HomePage />} />
                    {userName.map((data) => (
                        <Route path={`/${data.userName}`} element={<UserProfile userId={data._id} key={data._id} />} />

                    ))}
                    {/* {userName.map((data) => (                        */}
                    {users && <Route path={`/editprofile`} element={<EditProfile userId={user.id} />} />
                    }

                    {/* // ))} */}

                    <Route path="/chat" element={<Chat />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/suggestions" element={<Suggestions />} />




                </Route>
                <Route path="*" element={<h2> OOPS! Page Not Found</h2>} />
                {admin_token ? (
                    <>
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                    </>
                ) : (
                    <>
                        <Route path="/admin" element={<AdminLogin />} />
                    </>
                )}
                <><Route path="/admin" element={<AdminLogin />} /></>
                <Route element={<PrivateAdmin />}>
                    <Route path="/admin/dashboard" element={<AdminDash />} />
                    <Route path="/admin/users" element={<User />} />
                    <Route path="/admin/posts" element={<Post />} />
                </Route>
            </Routes>
        </Router>
    )
}
export default NavRoutes