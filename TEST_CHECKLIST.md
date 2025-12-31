# ✅ Checklist de Testes - Sunshine POS

## Pré-requisitos
- [ ] Backend rodando em `http://localhost:8000`
- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Print Bridge rodando em `http://localhost:3333` (opcional)

## Testes de Autenticação
- [ ] Login com admin (admin / test1234)
- [ ] Login com manager (manager / test1234)
- [ ] Login com staff (staff / test1234)
- [ ] Logout funciona
- [ ] Redirecionamento baseado em role funciona

## Testes de Usuários (Admin Only)
- [ ] Criar usuário Salon (role: staff, operation_type: SALON)
- [ ] Criar usuário Studio (role: staff, operation_type: STUDIO)
- [ ] Criar admin com BOTH
- [ ] Editar usuário e alterar operation_type
- [ ] Listar usuários mostra operation_type
- [ ] Filtrar usuários por role funciona

## Testes de Produtos
- [ ] Admin pode criar produto
- [ ] Admin pode editar produto
- [ ] Admin pode deletar produto
- [ ] Admin pode ajustar estoque
- [ ] Staff/Manager NÃO pode criar/editar/deletar
- [ ] Busca por código de barras funciona
- [ ] Scanner detecta código e abre modal

## Testes de POS
- [ ] Adicionar produto ao carrinho
- [ ] Remover produto do carrinho
- [ ] Ajustar quantidade
- [ ] Calcular subtotal, imposto e total corretamente
- [ ] Finalizar venda com CASH
- [ ] Finalizar venda com CARD
- [ ] Finalizar venda com TRANSFER
- [ ] Venda criada com operation_type correto
- [ ] Seletor de operação aparece para admin com BOTH
- [ ] Usuário Salon só vê SALON
- [ ] Usuário Studio só vê STUDIO

## Testes de Analytics
- [ ] Analytics mostra dados por usuário
- [ ] Filtro por período (dia/semana/mês) funciona
- [ ] Filtro por data custom funciona
- [ ] Admin com BOTH pode filtrar por SALON/STUDIO
- [ ] Staff vê apenas suas próprias vendas
- [ ] Analytics separa impostos corretamente
- [ ] Analytics por método de pagamento funciona

## Testes de Dashboard
- [ ] Cards de estatísticas carregam
- [ ] Gráfico de vendas exibe dados
- [ ] Top produtos exibe dados
- [ ] Vendas recentes listadas

## Testes de Operation Type
- [ ] Venda Salon criada com operation_type=SALON
- [ ] Venda Studio criada com operation_type=STUDIO
- [ ] Analytics filtra por operation_type
- [ ] Usuário Salon só vê vendas SALON
- [ ] Usuário Studio só vê vendas STUDIO
- [ ] Admin BOTH vê todas as vendas

## Testes de UI/UX
- [ ] Animações suaves funcionam
- [ ] Gradientes aparecem corretamente
- [ ] Cards têm sombras e hover effects
- [ ] Modais abrem/fecham suavemente
- [ ] Tabelas têm hover effects
- [ ] Botões têm feedback visual
- [ ] Responsividade mantida

## Testes de Integração
- [ ] Print Bridge responde (se rodando)
- [ ] Scanner funciona no POS
- [ ] Scanner funciona na página de produtos
- [ ] Impressão de recibo (se printer configurada)

