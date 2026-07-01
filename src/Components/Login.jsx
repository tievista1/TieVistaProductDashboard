import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'

const API = 'https://product.tievista.com/api';

const Login = ({ onLogin }) => {
  const { register, handleSubmit, getValues, formState: { errors } } = useForm();
  
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: password
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    const email = getValues('email');
    if (!email) {
      setMessage('Please enter your email');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post(`${API}/send-otp`, { email });
      setOtpSent(true);
      setStep(2);
      setMessage('OTP sent to your email');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    const email = getValues('email');
    const otp = getValues('otp');
    if (!otp) {
      setMessage('Please enter the OTP');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API}/verify-otp`, { email, otp });
      if (res.data.success) {
        setOtpVerified(true);
        setStep(3);
        setMessage('OTP verified! Enter your password');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Login
  const onSubmit = async (data) => {
    if (!otpVerified) {
      setMessage('Please verify OTP first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API}/login`, {
        email: data.email,
        password: data.password
      });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        onLogin(res.data.token);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex h-screen w-full bg-white font-sans'>
      
      {/* Left Side - Background Image & Logo */}
      <div 
        className='w-200 relative bg-cover bg-center flex flex-col justify-center items-center'
      >
        <img src="/DashboardLogin.png" alt="" className='z-0 w-full h-full' />
        <img src="/TieVistaLogoWhite.png" alt="" className='z-10 absolute bottom-70 left-1/2 transform -translate-x-1/2 w-100 h-40' />
        <h1 className='z-20 absolute bottom-66 left-85 transform -translate-x-1/2 text-xl w-100 text-white'>Trust. Transparency. Transformation</h1>
      </div>

      {/* Right Side - Form */}
      <div className='w-300 flex flex-col justify-center items-center p-8'>
        <div className="w-full max-w-md">
          
          {/* Headers */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-serif font-bold text-black mb-3">Admin Dashboard</h1>
            <p className="text-gray-700 text-sm">Welcome to TieVista Investment Product Dashboard</p>
          </div>
          
          <hr className="mb-8 border-gray-300" />

          {message && <p className='text-sm text-blue-600 mb-4 text-center font-medium'>{message}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            
            {/* Email Field */}
            <div className='flex flex-col gap-2'>
              <label htmlFor="email" className="text-xs font-bold tracking-wider text-gray-900 uppercase">
                Email ID<span className="text-red-500">*</span>
              </label>
              <input 
                id="email"
                type="email"
                disabled={otpSent}
                className='w-full border border-gray-400 rounded px-3 py-2 outline-none focus:border-[#D59D1C] transition-colors bg-white'
                {...register('email', { required: true })} 
              />
              {errors.email && <span className='text-red-500 text-xs'>Email is required</span>}
            </div>

            {/* OTP Section */}
            {!otpSent ? (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="flex items-center gap-2 border-none px-6 py-2 rounded bg-gradient-to-r from-[#F3D34F] to-[#D59D1C] text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                  {loading ? 'SENDING...' : 'SEND OTP'}
                </button>
              </div>
            ) : !otpVerified ? (
              <div className='flex flex-col gap-2 mt-2'>
                <div className="flex flex-row gap-4 items-center">
                  <input 
                    id="otp"
                    type="text" 
                    placeholder="Enter OTP"
                    className='flex-1 border border-gray-400 rounded px-3 py-2 outline-none tracking-widest text-center focus:border-[#D59D1C] transition-colors bg-white'
                    {...register('otp', { required: true })} 
                  />
                  <button
                    type="button" 
                    onClick={handleVerifyOTP} 
                    disabled={loading}
                    className="flex items-center justify-center gap-2 border-none px-6 py-2 rounded bg-gradient-to-r from-[#F3D34F] to-[#D59D1C] text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {loading ? 'VERIFYING...' : 'VERIFY OTP'}
                  </button>
                </div>
              </div>
            ) : null}

            {otpVerified && (
              <p className='text-green-600 text-sm font-semibold'>✅ OTP Verified successfully</p>
            )}

            {/* Password Field */}
            {otpVerified && (
              <div className='flex flex-col gap-2 mt-2'>
                <label htmlFor="password" className="text-xs font-bold tracking-wider text-gray-900 uppercase">
                  Password<span className="text-red-500">*</span>
                </label>
                <input 
                  id="password"
                  type="password"
                  className='w-full border border-gray-400 rounded px-3 py-2 outline-none focus:border-[#D59D1C] transition-colors bg-white'
                  {...register('password', { required: true })} 
                />
                {errors.password && <span className='text-red-500 text-xs'>Password is required</span>}
              </div>
            )}

            {/* Submit Button */}
            {otpVerified && (
              <div className="mt-6 flex justify-center">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-1/2 border-none px-6 py-3 rounded bg-gradient-to-r from-[#F3D34F] to-[#D59D1C] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md tracking-wide"
                >
                  {loading ? 'LOGGING IN...' : 'Log In'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login