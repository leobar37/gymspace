import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from 'console';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}
// http://kong:8000

// Create Supabase clients
const supabaseClient: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Test authentication functions
async function testSignUp(email: string, password: string) {
  console.log('\n=== Testing Sign Up ===');
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Sign up error:', error);
      return null;
    }

    console.log('Sign up successful:');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    return data;
  } catch (error) {
    console.error('Unexpected error during sign up:', error);
    return null;
  }
}

async function testSignIn(email: string, password: string) {
  console.log('\n=== Testing Sign In ===');
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error.message);
      return null;
    }

    console.log('Sign in successful:');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Access Token:', data.session?.access_token?.substring(0, 20) + '...');
    return data;
  } catch (error) {
    console.error('Unexpected error during sign in:', error);
    return null;
  }
}

async function testGetUser() {
  console.log('\n=== Testing Get Current User ===');
  try {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error('Get user error:', error.message);
      return null;
    }

    if (!user) {
      console.log('No user logged in');
      return null;
    }

    console.log('Current user:');
    console.log('User ID:', user.id);
    console.log('Email:', user.email);
    console.log('Created at:', user.created_at);
    return user;
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return null;
  }
}

async function testSignOut() {
  console.log('\n=== Testing Sign Out ===');
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error('Sign out error:', error.message);
      return false;
    }

    console.log('Sign out successful');
    return true;
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return false;
  }
}

async function testPasswordReset(email: string) {
  console.log('\n=== Testing Password Reset ===');
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    });

    if (error) {
      console.error('Password reset error:', error.message);
      return false;
    }

    console.log('Password reset email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    return false;
  }
}

async function testAdminGetUser(userId: string) {
  console.log('\n=== Testing Admin Get User ===');
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      console.error('Admin get user error:', error.message);
      return null;
    }

    console.log('User details (admin):');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at);
    console.log('Last sign in:', data.user.last_sign_in_at);
    return data.user;
  } catch (error) {
    console.error('Unexpected error getting user (admin):', error);
    return null;
  }
}

async function testAdminListUsers() {
  console.log('\n=== Testing Admin List Users ===');
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 10,
    });

    console.log('Admin users retrieved successfully:', { data });

    if (error) {
      console.error('Admin list users error:', error.message);
      return null;
    }

    console.log(`Total users: ${data.users.length}`);
    data.users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('  ID:', user.id);
      console.log('  Email:', user.email);
      console.log('  Created:', user.created_at);
    });
    return data.users;
  } catch (error) {
    console.error('Unexpected error listing users (admin):', error);
    return null;
  }
}

async function testListTables() {
  console.log('\n=== Testing List Database Tables ===');
  try {
    const { data, error } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      console.error('List tables error:', error.message);
      return null;
    }

    console.log('Available tables:');
    data?.forEach((table) => {
      console.log(`  - ${table.table_name}`);
    });
    return data;
  } catch (error) {
    console.error('Unexpected error listing tables:', error);
    return null;
  }
}

async function testListMembershipPlans() {
  console.log('\n=== Testing List Gym Membership Plans ===');
  try {
    const { data, error } = await supabaseAdmin.from('gym_membership_plans').select('*').limit(10);

    if (error) {
      console.error('List membership plans error:', error.message);
      return null;
    }

    console.log(`Total membership plans retrieved: ${data?.length || 0}`);

    if (data && data.length > 0) {
      data.forEach((plan, index) => {
        console.log(`\nPlan ${index + 1}:`);
        console.log('  ID:', plan.id);
        console.log('  Name:', plan.name);
        console.log('  Description:', plan.description);
        console.log('  Price:', plan.price);
        console.log('  Currency:', plan.currency);
        console.log('  Duration:', plan.duration_in_days, 'days');
        console.log('  Status:', plan.status);
        console.log('  Gym ID:', plan.gym_id);
        console.log('  Created:', plan.created_at);
      });
    } else {
      console.log('No membership plans found in the database');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error listing membership plans:', error);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting Supabase authentication tests...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Using anon key:', supabaseAnonKey?.substring(0, 20) + '...');
  console.log('Using service key:', supabaseServiceKey?.substring(0, 20) + '...');

  // Test credentials
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';

  // Run tests in sequence
  try {
    // 1. Test sign up
    const signUpResult = await testSignUp(testEmail, testPassword);

    // 2. Test sign in
    const signInResult = await testSignIn(testEmail, testPassword);

    // 3. Test get current user
    const currentUser = await testGetUser();

    // 4. Test password reset
    await testPasswordReset(testEmail);

    // 5. Test admin functions (only if we have a user ID)
    if (signInResult?.user?.id) {
      await testAdminGetUser(signInResult.user.id);
    }

    // 6. List all users (admin)
    await testAdminListUsers();

    // 7. List database tables
    await testListTables();

    // 8. List membership plans
    await testListMembershipPlans();

    // 9. Test sign out
    await testSignOut();

    // 10. Verify user is signed out
    await testGetUser();
  } catch (error) {
    console.error('Test suite failed:', error);
  }

  console.log('\n=== Tests Complete ===');
}

// Run the tests
runTests().catch(console.error);
