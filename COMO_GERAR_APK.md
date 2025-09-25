# 📱 Como Gerar APK - Calculadora Salarial de Moçambique

## 🎯 Opção 1: Método Simples (Recomendado)

### **Use o PWA (Progressive Web App)**
- ✅ **Não precisa APK**
- ✅ **Instala como app** no celular  
- ✅ **Funciona offline**
- ✅ **Atualizações automáticas**

**Como fazer:**
1. **Faça Deploy** no painel Emergent (50 créditos/mês)
2. **Receba URL:** `https://calculadora-salarial.emergent.dev`
3. **Abra no celular** > Chrome > Menu > "Adicionar à tela inicial"
4. **Pronto!** Ícone aparece como app normal

---

## 🔧 Opção 2: Gerar APK Real

### **Pré-requisitos no seu computador:**
```bash
# Instalar Node.js (https://nodejs.org)
# Instalar Git (https://git-scm.com)
```

### **Passo a Passo:**

#### **1. Configurar projeto localmente**
```bash
# Clone o projeto (se ainda não tem)
git clone [link-do-projeto]
cd calculadora-salarial/frontend

# Instalar dependências
npm install
npm install -g @expo/cli eas-cli
```

#### **2. Criar conta Expo (gratuito)**
```bash
# Criar conta em expo.dev (gratuito)
eas login
# Digite email e senha
```

#### **3. Configurar projeto**
```bash
# Configurar EAS Build
eas build:configure
# Escolha: Android > Sim para tudo
```

#### **4. Gerar APK**
```bash
# Comando para gerar APK
eas build --platform android --profile preview

# Aguardar 10-15 minutos
# Link de download aparecerá no terminal
```

#### **5. Download**
- ✅ **Link do APK** será enviado por email
- ✅ **Download direto** do terminal
- ✅ **Tamanho:** ~50-80MB

---

## 📲 Como Instalar APK no Celular

### **Método 1: Via WhatsApp/Telegram**
1. **Envie APK** para si mesmo no WhatsApp
2. **Baixe** no celular
3. **Configurações** > Segurança > "Fontes desconhecidas" ✅
4. **Abra arquivo** baixado
5. **Instalar**

### **Método 2: Via USB**
1. **Conecte celular** no computador
2. **Copie APK** para pasta Downloads do celular
3. **No celular:** abra gerenciador de arquivos
4. **Encontre APK** > Tocar > Instalar

### **Método 3: Via Google Drive**
1. **Upload APK** no Google Drive
2. **Compartilhe** com você mesmo
3. **Baixe no celular** via app Drive
4. **Instale** normalmente

---

## 🚀 Opção 3: Expo Go (Para Testes)

### **Desenvolvimento rápido:**
```bash
cd calculadora-salarial/frontend
npx expo start
# Aparece QR Code
```

1. **Instale Expo Go** da Play Store
2. **Escaneie QR Code** com o app
3. **App abre** no Expo Go
4. ❌ **Limitação:** precisa do Expo Go instalado

---

## 📊 Comparação das Opções

| Método | Facilidade | Tamanho | Offline | Atualizações |
|--------|------------|---------|---------|--------------|
| **PWA** | ⭐⭐⭐⭐⭐ | ~2MB | ✅ | Automáticas |
| **APK** | ⭐⭐⭐ | ~60MB | ✅ | Manual |
| **Expo Go** | ⭐⭐⭐⭐ | ~30MB | ❌ | Automáticas |

---

## 🎯 Recomendação Final

### **Para uso pessoal e amigos:** 
**➡️ Use PWA (Deploy Emergent)**
- Mais fácil de distribuir
- Funciona igual a app nativo  
- Não precisa APK

### **Para Play Store:**
**➡️ Gere APK com EAS Build**
- Necessário para publicar na loja
- Mais trabalho, mas profissional

### **Para desenvolvimento:**
**➡️ Use Expo Go**
- Testes rápidos
- Desenvolvimento ágil

---

## 🆘 Problemas Comuns

### **"Fontes desconhecidas" não aparece:**
- **Android 8+:** Configurações > Apps > Navegador > Instalar apps desconhecidos

### **APK não instala:**
- Verificar se é Android 6.0+
- Tentar outro navegador para download
- Verificar espaço disponível (100MB+)

### **Expo build falha:**
- Verificar conexão internet
- Tentar novamente (problemas temporários)
- Verificar se conta Expo está ativa

---

## 💡 Dica Pro

**Crie versão PWA primeiro:**
1. Deploy no Emergent
2. Teste com amigos  
3. Se precisar mesmo APK, gere depois
4. PWA funciona 95% igual ao APK!

**Comando completo para APK:**
```bash
cd frontend
npm install -g @expo/cli eas-cli
eas login
eas build:configure  
eas build --platform android --profile preview
```

🎉 **Sucesso!** Em 15 minutos você terá seu APK pronto!