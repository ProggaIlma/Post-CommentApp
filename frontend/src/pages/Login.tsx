import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/services/api';
import { FormInput, Button } from '@/components/ui';
import { useForm, toast } from '@/hooks';
import { LoginSchema } from '@/schemas';

const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const form = useForm({ email: '', password: '' }, LoginSchema);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const data = await authApi.login(values);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.email}!`);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  });

  // Demo credentials helper
  const fillDemo = (email: string) => {
    // Hack to set form values for demo
    const emailEl = document.querySelector<HTMLInputElement>('[name="email"]');
    const passEl = document.querySelector<HTMLInputElement>('[name="password"]');
    if (emailEl) { emailEl.value = email; emailEl.dispatchEvent(new Event('input', { bubbles: true })); }
    if (passEl) { passEl.value = 'password123'; passEl.dispatchEvent(new Event('input', { bubbles: true })); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Demo credentials box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm">
          <p className="font-semibold text-blue-800 mb-2">🧪 Demo Accounts (password: password123)</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: '👑 Super Admin', email: 'admin@test.com' },
              { label: '🛡 Moderator', email: 'mod@test.com' },
              { label: '👤 User 1', email: 'user1@test.com' },
              { label: '👤 User 2', email: 'user2@test.com' },
            ].map(({ label, email }) => (
              <button
                key={email}
                onClick={() => {
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                  const emailInput = document.querySelector<HTMLInputElement>('[name="email"]');
                  const passInput = document.querySelector<HTMLInputElement>('[name="password"]');
                  if (emailInput && nativeInputValueSetter) {
                    nativeInputValueSetter.call(emailInput, email);
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                  if (passInput && nativeInputValueSetter) {
                    nativeInputValueSetter.call(passInput, 'password123');
                    passInput.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="text-left text-xs text-blue-700 hover:text-blue-900 hover:underline py-0.5"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Sign In</h1>
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
              placeholder="••••••••"
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.password}
              touched={form.touched.password}
              autoComplete="current-password"
            />
            <Button type="submit" loading={form.isSubmitting} className="w-full mt-2">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
