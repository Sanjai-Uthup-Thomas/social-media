import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { getUserHead } from '../../../api/userApi'
import { logout } from '../../../features/auth/authSlice'
import Posts from '../posts/posts'
import Suggestions from '../Suggestions/Suggestions'



function HomePage() {
    const [Loader,setLoader]=useState(true)
    const dispatch=useDispatch()
    const logouthandel=()=>{
      dispatch(logout()) 
    }
    const user=localStorage.getItem('user')

      console.log(user);
      if(user?.username===undefined){
        var users=JSON.parse(user)
      }else{
        var users=user
      }
      const[DP,setDP]=useState([])
      const fetchData=async()=>{
          await getUserHead(users.id).then((response)=>{
              setDP(response.data[0])
              setLoader(false)
          })
      }
      useEffect(()=>{
          fetchData()
      },[user])
      


    return (
        Loader?<h1>loading ...</h1>: <main className=" grid grid-cols-3 container md:w-10/12 mx-auto pt-8 bg-gray-50  ">
        <div className="md:px-12 col-span-3 lg:col-span-2">
            
            <Posts/>
        </div>
        <div className="col-span-1 hidden lg:block px-12">
            <div className="fixed p-5 w-80">
                <div className="flex flex-row">
                    <a href="">
                        <img
                            className="rounded-full"
                            src={`http://localhost:4000/DP/${DP.DP}`}
                            width="100"
                        />
                    </a>
                    <div className="w-72 pl-2 m-auto">
                        <div className="text-sm font-medium">
                            {/* <Link to={`/${dataCurrentUser.me.username}`}>
                                {dataCurrentUser.me.username}
                            </Link> */}
                            {users?.username}
                        </div>
                        <div className="text-gray-500 text-sm leading-4">
                        {users?.username}
                        </div>
                    </div>
                    <div className="w-32 text-right m-auto">
                        <a
                            className="text-xs text-sky-500 font-bold cursor-pointer"
                            onClick={logouthandel}
                           
                        >
                            Log out
                        </a>
                    </div>
                </div>

                <Suggestions />
                {/* <Footer />  */}
            </div>
        </div>
    </main>
       
    )
}

export default HomePage