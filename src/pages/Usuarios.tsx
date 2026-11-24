import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  email: string | null;
  created_at: string;
}

export default function Usuarios() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar usuários');
      return;
    }

    setProfiles(data || []);
    setLoading(false);
  }

  async function handleDelete(profile: Profile) {
    if (profile.id === user?.id) {
      toast.error('Você não pode excluir sua própria conta por aqui');
      return;
    }

    if (!confirm(`Excluir o usuário ${profile.email}?`)) return;

    const { error } = await supabase.from('profiles').delete().eq('id', profile.id);

    if (error) {
      toast.error('Erro ao excluir usuário');
      return;
    }

    toast.success('Usuário excluído');
    fetchProfiles();
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-muted-foreground">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Usuários</h1>
        <p className="page-subtitle">{profiles.length} usuário(s) com acesso ao app</p>
      </div>

      {profiles.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {profiles.map((profile) => (
            <Card key={profile.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {profile.email}
                      {profile.id === user?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cadastrado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                {profile.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(profile)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
