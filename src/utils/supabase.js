const SUPABASE_URL = 'https://garhywqkxyxubpnurzlp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhcmh5d3FreHl4dWJwbnVyemxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MTA5NDgsImV4cCI6MjA5NTM4Njk0OH0.fsdQIKnROKwuXmc3ag37hJCfFoMqfxAlkD5oNNpDRJE';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json'
};

export const sb = {
  // Leads CRUD
  leads: {
    list: async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/leads?select=*&order=created_at.desc`, { headers });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
      } catch (e) {
        console.error('Leads list fetch failed:', e);
        return [];
      }
    },
    insert: async (item) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(item)
        });
        return await res.json();
      } catch (e) {
        console.error('Leads insert failed:', e);
        return [item];
      }
    },
    update: async (id, item) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(item)
        });
      } catch (e) {
        console.error('Leads update failed:', e);
      }
    },
    delete: async (id) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
          method: 'DELETE',
          headers
        });
      } catch (e) {
        console.error('Leads delete failed:', e);
      }
    }
  },

  // People CRUD
  people: {
    list: async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/people?select=*&order=created_at.desc`, { headers });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
      } catch (e) {
        console.error('People list fetch failed:', e);
        return [];
      }
    },
    insert: async (item) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/people`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(item)
        });
        return await res.json();
      } catch (e) {
        console.error('People insert failed:', e);
        return [item];
      }
    },
    update: async (id, item) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/people?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(item)
        });
      } catch (e) {
        console.error('People update failed:', e);
      }
    },
    delete: async (id) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/people?id=eq.${id}`, {
          method: 'DELETE',
          headers
        });
      } catch (e) {
        console.error('People delete failed:', e);
      }
    }
  },

  // Companies CRUD
  companies: {
    list: async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?select=*&order=created_at.desc`, { headers });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
      } catch (e) {
        console.error('Companies list fetch failed:', e);
        return [];
      }
    },
    insert: async (item) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/companies`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(item)
        });
        return await res.json();
      } catch (e) {
        console.error('Companies insert failed:', e);
        return [item];
      }
    },
    update: async (id, item) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(item)
        });
      } catch (e) {
        console.error('Companies update failed:', e);
      }
    },
    delete: async (id) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}`, {
          method: 'DELETE',
          headers
        });
      } catch (e) {
        console.error('Companies delete failed:', e);
      }
    }
  },

  // Projects CRUD
  projects: {
    list: async () => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.desc`, { headers });
        if (!res.ok) throw new Error('Network error');
        return await res.json();
      } catch (e) {
        console.error('Projects list fetch failed:', e);
        return [];
      }
    },
    insert: async (item) => {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(item)
        });
        return await res.json();
      } catch (e) {
        console.error('Projects insert failed:', e);
        return [item];
      }
    },
    update: async (id, item) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(item)
        });
      } catch (e) {
        console.error('Projects update failed:', e);
      }
    },
    delete: async (id) => {
      try {
        return await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`, {
          method: 'DELETE',
          headers
        });
      } catch (e) {
        console.error('Projects delete failed:', e);
      }
    }
  }
};
