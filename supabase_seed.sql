-- ═══════════════════════════════════════════════════
-- Diganta — Production Seed Script for Supabase SQL Editor
-- Creates default users, clubs, and memberships
-- All passwords: password123
-- ═══════════════════════════════════════════════════

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Step 1: Clean existing seed data (safe reset) ───
DELETE FROM public."ClubMember" WHERE id LIKE 'seed_%';
DELETE FROM public."Club" WHERE id LIKE 'seed_%';
DELETE FROM public."User" WHERE id LIKE 'seed_%';

-- Also remove any users with these emails (from previous partial seeds)
DELETE FROM public."ClubMember" WHERE "userId" IN (SELECT id FROM public."User" WHERE email IN ('admin@college.edu','dean@college.edu','principal@college.edu','faculty1@college.edu','faculty2@college.edu','student1@college.edu','student2@college.edu','transport@college.edu','security@college.edu','resource@college.edu','finance@college.edu'));
DELETE FROM public."Club" WHERE "facultyCoordinatorId" IN (SELECT id FROM public."User" WHERE email IN ('faculty1@college.edu','faculty2@college.edu'));
DELETE FROM public."User" WHERE email IN ('admin@college.edu','dean@college.edu','principal@college.edu','faculty1@college.edu','faculty2@college.edu','student1@college.edu','student2@college.edu','transport@college.edu','security@college.edu','resource@college.edu','finance@college.edu');

-- ─── Step 2: Create Users ───
INSERT INTO public."User" (id, name, email, "passwordHash", role, department, phone, "isActive", "createdAt", "updatedAt")
VALUES
  ('seed_admin_001',       'System Administrator',  'admin@college.edu',      crypt('password123', gen_salt('bf', 12)), 'admin',               'Administration',    NULL, true, NOW(), NOW()),
  ('seed_dean_001',        'Dr. Jane Smith',        'dean@college.edu',       crypt('password123', gen_salt('bf', 12)), 'dean',                'Academic Affairs',  NULL, true, NOW(), NOW()),
  ('seed_principal_001',   'Prof. Robert Johnson',  'principal@college.edu',  crypt('password123', gen_salt('bf', 12)), 'principal',            'Administration',    NULL, true, NOW(), NOW()),
  ('seed_faculty_001',     'Dr. Alice Brown',       'faculty1@college.edu',   crypt('password123', gen_salt('bf', 12)), 'faculty_coordinator', 'Computer Science',  NULL, true, NOW(), NOW()),
  ('seed_faculty_002',     'Dr. Mike Davis',        'faculty2@college.edu',   crypt('password123', gen_salt('bf', 12)), 'faculty_coordinator', 'Electronics',       NULL, true, NOW(), NOW()),
  ('seed_clubhead_001',    'John Doe',              'student1@college.edu',   crypt('password123', gen_salt('bf', 12)), 'club_head',           'Computer Science',  NULL, true, NOW(), NOW()),
  ('seed_student_001',     'Sarah Wilson',          'student2@college.edu',   crypt('password123', gen_salt('bf', 12)), 'student',             'Computer Science',  NULL, true, NOW(), NOW()),
  ('seed_transport_001',   'Transport Manager',     'transport@college.edu',  crypt('password123', gen_salt('bf', 12)), 'transport',           'Transport',         NULL, true, NOW(), NOW()),
  ('seed_security_001',    'Security Chief',        'security@college.edu',   crypt('password123', gen_salt('bf', 12)), 'security',            'Security',          NULL, true, NOW(), NOW()),
  ('seed_resource_001',    'Resource Manager',      'resource@college.edu',   crypt('password123', gen_salt('bf', 12)), 'resource',            'Resources',         NULL, true, NOW(), NOW()),
  ('seed_finance_001',     'Finance Manager',       'finance@college.edu',    crypt('password123', gen_salt('bf', 12)), 'finance',             'Finance',           NULL, true, NOW(), NOW());

-- ─── Step 3: Create Clubs ───
INSERT INTO public."Club" (id, name, description, department, type, "isActive", "facultyCoordinatorId", "createdAt", "updatedAt")
VALUES
  ('seed_club_cs',       'Computer Science Club', 'Promoting tech innovation and coding excellence',  'Computer Science', 'departmental',     true, 'seed_faculty_001', NOW(), NOW()),
  ('seed_club_ec',       'Electronics Society',   'Advancing electronics and circuit design',         'Electronics',      'departmental',     true, 'seed_faculty_002', NOW(), NOW()),
  ('seed_club_cultural', 'Cultural Committee',    'Organizing cultural events and festivals',         NULL,               'non_departmental', true, 'seed_faculty_001', NOW(), NOW()),
  ('seed_club_sports',   'Sports Club',           'Promoting sports and physical fitness',            NULL,               'non_departmental', true, 'seed_faculty_002', NOW(), NOW());

-- ─── Step 4: Assign Club Head ───
INSERT INTO public."ClubMember" (id, "userId", "clubId", role, "joinedAt")
VALUES
  ('seed_member_001', 'seed_clubhead_001', 'seed_club_cs', 'head', NOW());

-- ─── Verify ───
SELECT name, email, role FROM public."User" WHERE id LIKE 'seed_%' ORDER BY role;
SELECT name, type FROM public."Club" WHERE id LIKE 'seed_%';
