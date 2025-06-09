import './index.css'

import Routess from '../Routess.tsx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'


// import Login from './Components/NavBar/Logins';




createRoot(document.getElementById('root')!).render(
  <StrictMode>
  
    <Routess />
 
   
  </StrictMode>,
)
