import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  User,
  Bell,
  Shield,
  Palette,
  Save
} from "lucide-react";

const Configuracoes = () => {
  return (
    <AppLayout title="Configurações" description="Personalize o sistema conforme suas necessidades">
      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="w-4 h-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="usuario" className="gap-2">
            <User className="w-4 h-4" />
            Usuário
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>
                Informações do seu desmonte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social</Label>
                  <Input id="razaoSocial" placeholder="Desmonte ABC Ltda" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input id="nomeFantasia" placeholder="Desmonte ABC" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" placeholder="00.000.000/0001-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ie">Inscrição Estadual</Label>
                  <Input id="ie" placeholder="000.000.000.000" />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input id="endereco" placeholder="Rua, número, bairro" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" placeholder="00000-000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" placeholder="São Paulo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input id="estado" placeholder="SP" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuario">
          <Card>
            <CardHeader>
              <CardTitle>Perfil do Usuário</CardTitle>
              <CardDescription>
                Suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input id="nome" placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="joao@desmonte.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input id="cargo" placeholder="Administrador" disabled />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Configure como deseja receber alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novas perguntas</p>
                  <p className="text-sm text-muted-foreground">Receber alerta quando houver novas perguntas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Vendas realizadas</p>
                  <p className="text-sm text-muted-foreground">Notificar sobre novas vendas</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Estoque baixo</p>
                  <p className="text-sm text-muted-foreground">Alertar quando estoque estiver abaixo do mínimo</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Erros de sincronização</p>
                  <p className="text-sm text-muted-foreground">Notificar sobre falhas nas integrações</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Gerencie suas credenciais de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <Input id="senhaAtual" type="password" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input id="novaSenha" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input id="confirmarSenha" type="password" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autenticação em duas etapas</p>
                  <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                </div>
                <Switch />
              </div>
              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="w-4 h-4" />
                  Atualizar Senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Configuracoes;
