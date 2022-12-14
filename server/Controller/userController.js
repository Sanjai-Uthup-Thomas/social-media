const jwt = require('jsonwebtoken')
const userSignUp = require('../models/userSignUp')
const bcrypt = require('bcrypt')
const userHelpers = require('../Helpers/userHelpers')
const { response } = require('express')
const e = require('express')

module.exports = {

    //userSignup
    doSignup: async (req, res) => {
        // console.log(req.body);
        const { userName, phoneNumber, email, password } = req.body
        const UserName = await userSignUp.findOne({ userName: userName })
        if (UserName) {
            return res
                .status(200)
                .json({ msg: "Username is already in use" });
        }
        const Email = await userSignUp.findOne({ email: email })
        if (Email) {
            return res
                .status(200)
                .json({ msg: "Email is already in use" });
        }
        const Phone = await userSignUp.findOne({ phoneNumber: phoneNumber })
        if (Phone) {
            return res
                .status(200)
                .json({ msg: "Phone number is already in use" });
        }



        const otp = userHelpers.OTPgenerator()
        userHelpers.sentOTPverificationmail(email, otp)
        const saltPassword = await bcrypt.genSalt(10)
        const securePassword = await bcrypt.hash(password, saltPassword)
        const secureOTP = await bcrypt.hash(otp, saltPassword)
        const signedUpUser = {
            userName: userName,
            phoneNumber: phoneNumber,
            email: email,
            password: securePassword,
            otp: secureOTP

        }
        res.json(signedUpUser)


    },

    doOtpVerify: async (req, res) => {

        // console.log(req.body);
        const { userName, phoneNumber, email, password, otp, OTP } = req.body
        const isMatch = await bcrypt.compare(OTP, otp);


        if (isMatch) {

            const signedUpUser = new userSignUp({
                userName: userName,
                phoneNumber: phoneNumber,
                email: email,
                password: password

            })
            signedUpUser.save()
                .then(data => {
                    console.log(data);
                    res.json(data);
                })
                .catch(err => {
                    res.json(err);
                });

        } else {
            res.json("error")
        }


    },
    //userLogin
    doLogin: async (req, res) => {
        try {
            // console.log(req.body);
            const { email, password } = req.body
            const user = await userSignUp.findOne({ email: email })
            // console.log(user);
            if (!user) {
                return res
                    .status(200)
                    .json({ msg: "No account found" });
            }
            const id = user.id
            // console.log(id);
            const blockUser = await userSignUp.findById(id, { Status: true })
            if (!blockUser) {
                return res
                    .status(200)
                    .json({ msg: "Your account has been blocked" })
            }


            const isMatch = await bcrypt.compare(password, user.password);


            if (!isMatch) return res.status(200).json({ msg: "Invalid password" });
            await userSignUp.findByIdAndUpdate(id, { $set: { reportStatus: false } })
            const token = jwt.sign({ email: user.userName, id: user._id }, process.env.JWT_SECRET,
                { expiresIn: "3d" })
            // console.log("token: " + token);

            res.json({
                token,
                user: {
                    id: user._id,
                    username: user.userName,
                    profilePhoto: user.profilePhoto
                },
            });
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    },
    doForgetPassword: async (req, res) => {
        console.log(req.body);
        const { data } = req.body;
        try {
            const user = await userHelpers.findUser(data)
            console.log(user);
            if (user.error) {
                res.json(user)
            } else {
                const { _id, email } = user
                console.log(email);
                const otp = userHelpers.OTPgenerator()
                userHelpers.sentOTPverificationmail(email, otp)
                const saltPassword = await bcrypt.genSalt(10)
                const secureOTP = await bcrypt.hash(otp, saltPassword)
                const encryptedOTP = await userHelpers.encryptedOTPintoDB(_id, secureOTP)
                res.json(encryptedOTP)

            }

        } catch (err) {
            res.json({ error: err?.message })
        }
    },
    doOtpLogin: async (req, res) => {
        try {
            console.log(req.body);
            const { userId, otp, password } = req.body
            const user = await userSignUp.findById(userId)
            const isMatch = await bcrypt.compare(otp, user.otp);
            if (!isMatch) return res.json({ msg: "Invalid OTP" });
            const saltPassword = await bcrypt.genSalt(10)
            const securePassword = await bcrypt.hash(password, saltPassword)
            await userSignUp.findByIdAndUpdate(userId, {
                $set: {
                    password: securePassword
                }
            })
            return res.json(true)
        } catch (err) {
            res.json({ error: err?.message })
        }
    },
    //check if token is valid
    doTokenIsValid: async (req, res) => {
        try {
            // console.log("req.user", req.user);
            const token = req.headers("x-auth-token")
            // console.log(token, "usrcon 63");
            if (!token) return res.json(false)
            const verified = jwt.verify(token, process.env.JWT_SECRET)
            // console.log(verified);
            if (!verified) return res.json(false)
            const user = await userSignUp.findById(verified.id)
            if (!user) return res.json(false)
            return res.json(true)
        } catch (err) {
            res.json({ error: err?.message })
        }

    },
    doPost: async (req, res) => {
        req.body.postImage = req.file.filename
        await userHelpers.Posts(req.body, req.user)
        res.json(req.body)
    },
    getPost: (req, res) => {
        // console.log("get post");

        const userId = req.user
        // console.log("get post");
        // console.log("userId: ", userId);
        userHelpers.listPosts(userId).then((response) => {
            res.json(response)
        })
    },
    getTagedPosts:(req,res)=>{
        console.log(req.params);
        const tagId=req.params.id
        userHelpers.tagedPosts(tagId).then((response) => {
            res.json(response)
        })
    },
    getLatestPost: (req, res) => {
        console.log("ghjk");
        userHelpers.latestPosts().then((response) => {
            res.json(response)
        })
    },
    doLikePost: (req, res) => {
        // console.log(req.body.id);
        // console.log(req.user);
        const postId = req.body.id
        const userId = req.user
        userHelpers.doLikePost(postId, userId).then((response) => {
            res.json(response)
        })
    },
    doUnLikePost: (req, res) => {
        const postId = req.body.id
        const userId = req.user
        userHelpers.doUnLikePost(postId, userId).then((response) => {
            res.json(response)
        })
    },
    doComment: (req, res) => {
        try {
            const { postId, comment } = req.body
            const userId = req.user
            userHelpers.docommentPost(postId, userId, comment).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getComment: async (req, res) => {
        try {
            await userHelpers.getCommentPosts(req.params.id).then((response) => {
                res.json(response)
            })


        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getCommentPost: async (req, res) => {
        try {
            // console.log("postId", req.params.id)
            await userHelpers.getPost(req.params.id).then((response) => {
                // console.log(response);
                res.json(response)

            })
        } catch (err) {
            res.json({ error: err.message })
        }

    },
    doUserNames: async (req, res) => {
        try {
            await userHelpers.getUserNames().then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doUserHead: async (req, res) => {
        try {
            // console.log(req.params.id);
            await userHelpers.getUserHead(req.params.id).then((response) => {

                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doUserPosts: async (req, res) => {
        try {
            // console.log(req.params.id);
            await userHelpers.getUserPosts(req.params.id).then((response) => {
                // console.log(response);
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getUserProfileForEdit: async (req, res) => {
        try {
            // console.log(req.params.id);
            await userHelpers.getUserProfileForEdit(req.params.id).then((response) => {
                // console.log(response);
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doEditProfile: (req, res) => {
        try {
            userHelpers.doUserProfileEdit(req.params.id, req.body).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doChangeDP: (req, res) => {
        try {
            req.body.photo = req.file.filename
            userHelpers.changeDp(req.user, req.body.photo).then((response) => {
                // console.log(response);
                res.json(response);
            })

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    changePassword: async (req, res) => {
        try {
            // console.log(req.params);
            // console.log("req.body ",req.body);
            const { password } = req.body
            const saltPassword = await bcrypt.genSalt(10)
            const securePassword = await bcrypt.hash(password, saltPassword)
            await userHelpers.doChangePassword(req.user, securePassword)
            // console.log(response);
            res.json(response);

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doSavePost: (req, res) => {
        try {
            // console.log(req.body.id);
            // console.log("req.user",req.user);
            const postId = req.body.id
            const userId = req.user
            userHelpers.doBookPost(postId, userId).then((response) => {
                res.json(response)
            })

        } catch (err) {
            res.json({ error: err.message })
        }

    },
    doUnsavePost: (req, res) => {
        try {
            // console.log(req.body.id);
            // console.log(req.user);
            const postId = req.body.id
            const userId = req.user
            userHelpers.doUnBookPost(postId, userId).then((response) => {
                res.json(response)
            })

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doSavedPosts: async (req, res) => {
        try {
            // console.log(req.params.id);
            await userHelpers.getSavedPosts(req.params.id).then((response) => {
                console.log(response);
                res.json(response)
            })

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doSearch: async (req, res) => {
        try {
            // console.log(req.params.data);
            await userHelpers.userSearch(req.params.data).then((response) => {
                res.json(response)
            })


        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doFollow: (req, res) => {
        try {
            // console.log("req.params in follow", req.params.id);
            // console.log("req.user in follow", req.user);
            userHelpers.userFollow(req.user, req.params.id).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doUnfollow: (req, res) => {
        try {
            // console.log("req.params in follow", req.params.id);
            // console.log("req.user in follow", req.user);
            userHelpers.userUnfollow(req.user, req.params.id).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getSuggestions: (req, res) => {
        try {
            userHelpers.doSuggestions(req.params.id).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doDeletePost: (req, res) => {
        try {
            // console.log("req.params in delete", req.params.id);
            userHelpers.deletePost(req.params.id).then((response) => {
                res.json(response)
            })

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doReportPost: (req, res) => {
        try {
            console.log(req.body)
            console.log(req.user)
            userHelpers.reportPost(req.user, req.body).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getFollowers: (req, res) => {
        try {
            console.log(req.params.id)
            userHelpers.followers(req.params.id).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getFollowing: (req, res) => {
        try {
            console.log(req.params.id)
            userHelpers.following(req.params.id).then((response) => {
                res.json(response)
            })
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    doNotifications: async (req, res) => {
        try {
            console.log(req.body);
            const result = await userHelpers.addNotifications(req.body)
            res.json(result)

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getNotifications: async (req, res) => {
        try {
            const result = await userHelpers.getUserNotifications(req.user)
            res.json(result)
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    EditNotifications: async (req, res) => {
        try {
            console.log(req.params.id);
            const result = await userHelpers.doNotifications(req.params.id)
            res.json(result)
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getNotificationsCount: async (req, res) => {
        try {
            // console.log("getNotificationsCount");
            const result = await userHelpers.getUserNotificationsCount(req.user)
            res.json(result)
        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getTags: async (req, res) => {
        try {
            console.log(req.query.data);
            var str = req.query.data;
            var result = '#' + str;
            console.log(result)

            const response = await userHelpers.getAllTags(result)
            res.json(response)

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    getTopTenTags: (req, res) => {
        try {
            userHelpers.TopTenTags().then((response) => {
                res.json(response)
            }).catch((err) => {
                console.log(err);
            })

        } catch (err) {
            res.json({ error: err.message })
        }
    },
    deactiveAccount: (req, res) => {
        try {
            console.log(req.params);
            const { id } = req.params
            userHelpers.doDeactiveAccount(id).then((response) => {
                res.json(response)
            }).catch((err) => {
                console.log(err);
            })

        } catch (err) {
            res.json({ error: err.message })
        }
    }

}