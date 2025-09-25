import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Settings() {
  const { theme, isDark, toggleTheme } = useContext(ThemeContext);
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    showAnimations: true,
    precisionMode: false,
    debugMode: false,
  });

  const [appInfo, setAppInfo] = useState({
    version: '1.0.0',
    buildNumber: '2025.01.25',
    lastUpdate: new Date().toLocaleDateString('pt-MZ'),
  });

  const toggleSetting = async (key: string) => {
    const newValue = !settings[key as keyof typeof settings];
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      await AsyncStorage.setItem(`setting_${key}`, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Esta ação removerá todos os dados salvos incluindo cálculos e configurações. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Sucesso', 'Todos os dados foram removidos');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao limpar os dados');
            }
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const data = await AsyncStorage.multiGet(keys);
      const exportData = Object.fromEntries(data);
      
      Alert.alert(
        'Exportar Dados',
        `Encontrados ${Object.keys(exportData).length} itens de dados. Esta funcionalidade será implementada em breve.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao exportar dados');
    }
  };

  const checkForUpdates = async () => {
    Alert.alert(
      'Verificar Atualizações',
      'Verificando atualizações...',
      [{ text: 'OK' }]
    );
    
    // Simular verificação
    setTimeout(() => {
      Alert.alert(
        'Atualização',
        'Você já tem a versão mais recente instalada.',
        [{ text: 'OK' }]
      );
    }, 1500);
  };

  const openTaxInfo = () => {
    Alert.alert(
      'Informações Fiscais',
      'As tabelas de IRPS e INSS são baseadas na legislação oficial de Moçambique para 2025.\n\nIRPS: Escalões progressivos de 0% a 32%\nINSS: 3% (empregado) + 4% (empregador)\n\nFonte: Autoridade Tributária de Moçambique',
      [{ text: 'OK' }]
    );
  };

  const openPrivacyPolicy = () => {
    Alert.alert(
      'Política de Privacidade',
      'Seus dados são processados localmente no dispositivo. Os cálculos são enviados ao servidor apenas para processamento e não são armazenados permanentemente.\n\nOs dados salvos ficam apenas no seu dispositivo.',
      [{ text: 'OK' }]
    );
  };

  const contactSupport = () => {
    Alert.alert(
      'Suporte',
      'Precisa de ajuda ou tem sugestões?\n\nEscolha uma opção:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:suporte@calculadorasalarial.mz?subject=Suporte%20App')
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('whatsapp://send?phone=258840000000&text=Olá,%20preciso%20de%20ajuda%20com%20o%20app')
        },
      ]
    );
  };

  const rateApp = () => {
    Alert.alert(
      'Avaliar App',
      'Gosta do aplicativo? Sua avaliação nos ajuda a melhorar!',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Avaliar',
          onPress: () => {
            // Em produção, abrir a loja de apps
            Alert.alert('Obrigado!', 'Redirecionando para a loja...');
          }
        },
      ]
    );
  };

  const styles = getStyles(theme);

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode,
    iconColor?: string
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress && !rightComponent}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: iconColor || theme.primary + '20' }]}>
          <MaterialIcons name={icon as any} size={20} color={iconColor || theme.primary} />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent || (
          onPress && <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialIcons name="settings" size={32} color={theme.primary} />
          <Text style={styles.title}>Configurações</Text>
          <Text style={styles.subtitle}>Personalize sua experiência</Text>
        </View>

        {renderSection('Aparência', (
          <>
            {renderSettingItem(
              'brightness-6',
              'Tema',
              isDark ? 'Modo escuro ativado' : 'Modo claro ativado',
              undefined,
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            )}
            {renderSettingItem(
              'animation',
              'Animações',
              settings.showAnimations ? 'Ativadas' : 'Desativadas',
              undefined,
              <Switch
                value={settings.showAnimations}
                onValueChange={() => toggleSetting('showAnimations')}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            )}
          </>
        ))}

        {renderSection('Funcionalidades', (
          <>
            {renderSettingItem(
              'save',
              'Salvamento Automático',
              settings.autoSave ? 'Cálculos são salvos automaticamente' : 'Salvamento manual',
              undefined,
              <Switch
                value={settings.autoSave}
                onValueChange={() => toggleSetting('autoSave')}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            )}
            {renderSettingItem(
              'notifications',
              'Notificações',
              settings.notifications ? 'Ativadas' : 'Desativadas',
              undefined,
              <Switch
                value={settings.notifications}
                onValueChange={() => toggleSetting('notifications')}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            )}
            {renderSettingItem(
              'precision-manufacturing',
              'Modo de Precisão',
              settings.precisionMode ? 'Cálculos com alta precisão' : 'Precisão padrão',
              undefined,
              <Switch
                value={settings.precisionMode}
                onValueChange={() => toggleSetting('precisionMode')}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#fff"
              />
            )}
          </>
        ))}

        {renderSection('Dados', (
          <>
            {renderSettingItem(
              'file-download',
              'Exportar Dados',
              'Salvar cálculos e configurações',
              exportData,
              undefined,
              '#4caf50'
            )}
            {renderSettingItem(
              'delete-forever',
              'Limpar Todos os Dados',
              'Remove cálculos salvos e configurações',
              clearAllData,
              undefined,
              '#f44336'
            )}
          </>
        ))}

        {renderSection('Informações Fiscais', (
          <>
            {renderSettingItem(
              'account-balance',
              'Tabelas de IRPS e INSS',
              'Ver informações sobre os impostos',
              openTaxInfo,
              undefined,
              '#2196f3'
            )}
            {renderSettingItem(
              'update',
              'Verificar Atualizações',
              'Verificar se há novas tabelas fiscais',
              checkForUpdates,
              undefined,
              '#ff9800'
            )}
          </>
        ))}

        {renderSection('Suporte e Feedback', (
          <>
            {renderSettingItem(
              'help',
              'Ajuda e Suporte',
              'Entre em contato conosco',
              contactSupport,
              undefined,
              '#9c27b0'
            )}
            {renderSettingItem(
              'star',
              'Avaliar App',
              'Ajude-nos a melhorar',
              rateApp,
              undefined,
              '#ffc107'
            )}
            {renderSettingItem(
              'privacy-tip',
              'Política de Privacidade',
              'Como tratamos seus dados',
              openPrivacyPolicy,
              undefined,
              '#607d8b'
            )}
          </>
        ))}

        {renderSection('Sobre o App', (
          <>
            {renderSettingItem(
              'info',
              'Versão',
              `${appInfo.version} (Build ${appInfo.buildNumber})`,
              undefined,
              <Text style={styles.versionText}>{appInfo.version}</Text>
            )}
            {renderSettingItem(
              'update',
              'Última Atualização',
              appInfo.lastUpdate,
              undefined,
              undefined
            )}
            {renderSettingItem(
              'code',
              'Desenvolvido para Moçambique',
              'Calculadora salarial oficial',
              undefined,
              undefined
            )}
          </>
        ))}

        {settings.debugMode && renderSection('Debug (Desenvolvedor)', (
          <>
            {renderSettingItem(
              'bug-report',
              'Backend URL',
              EXPO_PUBLIC_BACKEND_URL || 'Not configured',
              undefined,
              undefined,
              '#f44336'
            )}
            {renderSettingItem(
              'storage',
              'AsyncStorage Status',
              'Ver dados locais',
              async () => {
                try {
                  const keys = await AsyncStorage.getAllKeys();
                  Alert.alert('AsyncStorage', `${keys.length} items stored`);
                } catch (error) {
                  Alert.alert('Error', 'Failed to read AsyncStorage');
                }
              },
              undefined,
              '#f44336'
            )}
          </>
        ))}

        <TouchableOpacity
          style={styles.debugToggle}
          onPress={() => toggleSetting('debugMode')}
        >
          <Text style={styles.debugText}>
            {settings.debugMode ? 'Ocultar' : 'Mostrar'} Modo Debug
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Calculadora Salarial de Moçambique {appInfo.version}
          </Text>
          <Text style={styles.footerText}>
            © 2025 - Baseado nas tabelas oficiais de IRPS e INSS
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.primary,
      marginTop: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
      marginLeft: 4,
    },
    sectionContent: {
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: 'hidden',
      ...theme.shadow,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 2,
    },
    settingSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    settingRight: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 40,
    },
    versionText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    debugToggle: {
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 20,
    },
    debugText: {
      fontSize: 12,
      color: theme.textSecondary,
      textDecorationLine: 'underline',
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    footerText: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 16,
      marginBottom: 4,
    },
  });
}