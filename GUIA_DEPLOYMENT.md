# 📱 Guia de Deployment - Calculadora Salarial de Moçambique

## 🚀 Opções de Distribuição

### **Opção 1: Progressive Web App (PWA) - RECOMENDADO** ⭐

**✅ Vantagens:**
- Funciona em qualquer dispositivo (Android, iPhone, PC)
- Não precisa baixar da Google Play Store
- Atualizações automáticas
- Fácil de compartilhar (só enviar link)
- Funciona offline após primeira visita

**📱 Como instalar no celular:**
1. Abra o navegador (Chrome/Safari)
2. Acesse: `[URL_DO_SEU_DEPLOY]`
3. No Chrome: Menu > "Adicionar à tela inicial"
4. No iPhone: Safari > Compartilhar > "Adicionar à Tela de Início"
5. Ícone aparece na tela inicial como um app normal!

---

### **Opção 2: APK Android (Arquivo de Instalação)** 📲

**Como gerar o APK:**

#### **Método 1: Usando seu computador**
```bash
# 1. Clone o projeto
git clone [seu-repositorio]
cd calculadora-salarial

# 2. Configure Expo
npm install -g @expo/cli eas-cli
cd frontend

# 3. Configure EAS Build
eas login  # Crie conta gratuita no expo.dev
eas build:configure

# 4. Gere o APK
eas build --platform android --profile preview
```

#### **Método 2: Usando Expo Build Service (Online)**
1. Acesse: https://expo.dev
2. Crie conta gratuita
3. Faça upload do código
4. Configure build Android
5. Download do APK após 10-15 minutos

---

## 📤 Como Distribuir para Amigos

### **Via PWA (Mais Fácil)**
```
"Oi! Instala essa calculadora salarial de Moçambique:
🔗 [URL_DO_SEU_APP]

Como instalar:
1. Abre o link no navegador
2. Menu > 'Adicionar à tela inicial'
3. Pronto! Vai ficar como app normal"
```

### **Via APK**
```
"Baixa esse app de calculadora salarial:
📱 [LINK_DO_APK]

Como instalar:
1. Baixa o arquivo APK
2. Configurações > Segurança > 'Fontes desconhecidas' ✅
3. Abre o arquivo baixado
4. Instalar"
```

---

## 🌍 Deploy na Emergent Platform

### **Deploy Automático (50 créditos/mês)**
1. **Clique em "Deploy" no painel Emergent**
2. **Aguarde 10 minutos**
3. **Receba URL pública:** `https://seuapp.emergent.dev`
4. **Teste no celular**
5. **Compartilhe com amigos**

### **Configuração de Produção**
- Backend: Configurado para produção
- Frontend: Build otimizado
- Database: MongoDB persistente
- SSL: Certificado automático

---

## 📊 Recursos do App

### **✅ Funcionalidades Implementadas**
- ✅ Cálculo IRPS com matriz oficial 2025
- ✅ Cálculo INSS (3% empregado + 4% empregador)  
- ✅ Suporte a dependentes (0-4)
- ✅ Descontos personalizados
- ✅ Visualização mensal/anual
- ✅ Download PDF dos resultados
- ✅ Tabela detalhada de cálculos
- ✅ Interface em português
- ✅ Design mobile responsivo

### **📱 Compatibilidade**
- ✅ Android 6.0+
- ✅ iPhone iOS 12+
- ✅ Chrome, Safari, Firefox
- ✅ Tablets e computadores

---

## 🔧 Manutenção e Updates

### **Para atualizar o app:**
1. **PWA:** Automático quando redeployar
2. **APK:** Precisa gerar nova versão

### **Monitoramento:**
- Logs disponíveis no painel Emergent
- Analytics de uso
- Backup automático do database

---

## 💡 Dicas para Distribuição

### **Para uso pessoal/familiar:**
- **Use PWA** - mais prático
- Compartilhe o link direto

### **Para distribuição ampla:**
- **Gere APK** para Google Play Store
- **PWA** para distribuição imediata

### **Para empresas:**
- **Deploy privado** com autenticação
- **Customização** com logo da empresa
- **Relatórios** personalizados

---

## 🆘 Suporte

**Se tiver problemas:**
1. **Check logs** no painel Emergent
2. **Teste em navegador** primeiro
3. **Verifique conexão** internet
4. **Contato:** [seu-email]

**App funcionando?** 
Compartilhe feedback e sugestões! 🚀