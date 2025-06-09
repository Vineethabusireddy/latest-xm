import { User } from "../models/User.js";

//Save register

export const saveRegistrationDetails = async (req, res) => {
  const { email, name, phone, pincode } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Email and name are required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user details
    await user.update({ name, phone, pincode });

    res.status(200).json({
      message: "Registration details saved successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Error saving registration details:", error);
    res.status(500).json({
      message: "Failed to save registration details",
      error: error.message,
    });
  }
};

// ✅ Update Profile

export const updateProfile = async (req,res)=>{
   const {name,email,phone} = req.body;

   if(!email || !name){
    return res.status(400).json({message: "Email and name are required"});
}
   try{
     let user = await User.findOne({where:{email}});
     if(user){
      await user.update({name,phone});
     }
     res.status(200).json({message:"Profile updated successfully",user});
   }catch(error){
     console.log("Error is occuring whiel updating");
     res.status(500).json({message:"Failed to update Profile"});
   }
};


// ✅ Fetch User Profile

export const getProfile = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    const error = new Error("Email is required");
    return res.status(400).json({ message: error.message, stack: error.stack });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};



export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

