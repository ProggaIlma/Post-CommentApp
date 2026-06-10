import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';
import { FormInput, Button } from '@/components/ui';
import { useForm, toast } from '@/hooks';
import { RegisterSchema } from '@/schemas';

const Register: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const form = useForm({ email: '', password: '' }, RegisterSchema);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.register(values);
      login(data.user, data.token);
      toast.success('Account created! Welcome aboard!');
      navigate('/');
    } catch (err: any) {
      // Extract error message from various response formats
      const errorMsg = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        'Registration failed';
      toast.error(errorMsg);
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Create Account</h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            New accounts are created as <span className="font-medium text-green-700">Regular User</span>
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <FormInput
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.values.email}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.email}
              touched={form.touched.email}
              autoComplete="email"
            />
            <FormInput
              label="Password"
              name="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.password}
              touched={form.touched.password}
              autoComplete="new-password"
            />
            <Button type="submit" loading={form.isSubmitting} className="w-full mt-2">
              Create Account
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
