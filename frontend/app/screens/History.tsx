import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ThemeContext } from '../context/ThemeContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface CalculationResult {
  id: string;
  gross_salary: number;
  net_salary: number;
  irps_tax: number;
  inss_employee: number;
  inss_employer: number;
  medical_aid: number;
  loans: number;
  other_discounts: number;
  total_discounts: number;
  monthly_breakdown: {[key: string]: number};
  annual_breakdown: {[key: string]: number};
  calculation_type: string;
  timestamp?: string;
  saved_name?: string;
  saved_at?: string;
}

export default function History() {
  const { theme } = useContext(ThemeContext);
  const [savedCalculations, setSavedCalculations] = useState<CalculationResult[]>([]);
  const [recentCalculations, setRecentCalculations] = useState<CalculationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'saved' | 'recent'>('saved');

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    setIsLoading(true);
    try {
      // Load saved calculations
      const saved = await AsyncStorage.getItem('savedCalculations');
      if (saved) {
        setSavedCalculations(JSON.parse(saved));
      }

      // Load recent calculations from backend
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/calculation-history?limit=20`);
      if (response.ok) {
        const recent = await response.json();
        setRecentCalculations(recent);
      }
    } catch (error) {
      console.error('Error loading calculations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MTn`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const deleteCalculation = async (id: string, isSaved: boolean) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir este cálculo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (isSaved) {
              const updated = savedCalculations.filter(calc => calc.id !== id);
              setSavedCalculations(updated);
              await AsyncStorage.setItem('savedCalculations', JSON.stringify(updated));
            } else {
              // For recent calculations, you might want to mark them as deleted in the backend
              setRecentCalculations(prev => prev.filter(calc => calc.id !== id));
            }
          },
        },
      ]
    );
  };

  const exportToPDF = async (calculation: CalculationResult) => {
    try {
      const html = generatePDFHTML(calculation);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Cálculo Salarial',
        });
      } else {
        Alert.alert('Sucesso', 'PDF gerado com sucesso!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar PDF');
      console.error('PDF generation error:', error);
    }
  };

  const generatePDFHTML = (calculation: CalculationResult) => {
    const monthly = calculation.monthly_breakdown;
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; color: #2E7D32; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; }
            .value { color: #333; }
            .total { background-color: #f0f0f0; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Calculadora Salarial</h1>
            <p>Moçambique • IRPS & INSS • 2025</p>
            ${calculation.saved_name ? `<p><strong>${calculation.saved_name}</strong></p>` : ''}
            <p>Data: ${formatDate(calculation.saved_at || calculation.timestamp || new Date().toISOString())}</p>
          </div>
          
          <div class="section">
            <h2>Resumo Salarial (Mensal)</h2>
            <div class="row">
              <span class="label">Salário Bruto:</span>
              <span class="value">${formatCurrency(monthly.salario_bruto)}</span>
            </div>
            <div class="row">
              <span class="label">Salário Líquido:</span>
              <span class="value">${formatCurrency(monthly.salario_liquido)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Detalhamento dos Descontos</h2>
            <div class="row">
              <span class="label">IRPS:</span>
              <span class="value">${formatCurrency(monthly.irps)}</span>
            </div>
            <div class="row">
              <span class="label">INSS (Empregado 3%):</span>
              <span class="value">${formatCurrency(monthly.inss_empregado)}</span>
            </div>
            <div class="row">
              <span class="label">INSS (Empregador 4%):</span>
              <span class="value">${formatCurrency(monthly.inss_empregador)}</span>
            </div>
            ${monthly.seguro_medico > 0 ? `
              <div class="row">
                <span class="label">Seguro Médico:</span>
                <span class="value">${formatCurrency(monthly.seguro_medico)}</span>
              </div>
            ` : ''}
            ${monthly.emprestimos > 0 ? `
              <div class="row">
                <span class="label">Empréstimos:</span>
                <span class="value">${formatCurrency(monthly.emprestimos)}</span>
              </div>
            ` : ''}
            ${monthly.outros_descontos > 0 ? `
              <div class="row">
                <span class="label">Outros Descontos:</span>
                <span class="value">${formatCurrency(monthly.outros_descontos)}</span>
              </div>
            ` : ''}
            <div class="row total">
              <span class="label">Total de Descontos:</span>
              <span class="value">${formatCurrency(monthly.total_descontos)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Valores Anuais</h2>
            <div class="row">
              <span class="label">Salário Bruto Anual:</span>
              <span class="value">${formatCurrency(calculation.annual_breakdown.salario_bruto)}</span>
            </div>
            <div class="row">
              <span class="label">Salário Líquido Anual:</span>
              <span class="value">${formatCurrency(calculation.annual_breakdown.salario_liquido)}</span>
            </div>
            <div class="row">
              <span class="label">Total de Descontos Anual:</span>
              <span class="value">${formatCurrency(calculation.annual_breakdown.total_descontos)}</span>
            </div>
          </div>

          <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #666;">
            Cálculos baseados nas tabelas oficiais de IRPS e INSS de Moçambique para 2025
          </div>
        </body>
      </html>
    `;
  };

  const renderCalculationItem = ({ item, index }: { item: CalculationResult; index: number }) => {
    const isSaved = activeTab === 'saved';
    
    return (
      <TouchableOpacity
        style={styles.calculationItem}
        onPress={() => {
          setSelectedCalculation(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.calculationHeader}>
          <View>
            <Text style={styles.calculationTitle}>
              {item.saved_name || `Cálculo ${index + 1}`}
            </Text>
            <Text style={styles.calculationDate}>
              {formatDate(item.saved_at || item.timestamp || new Date().toISOString())}
            </Text>
            <Text style={styles.calculationType}>
              {item.calculation_type === 'gross_to_net' ? 'Bruto → Líquido' : 'Líquido → Bruto'}
            </Text>
          </View>
          <View style={styles.calculationActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => exportToPDF(item)}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color="#f44336" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteCalculation(item.id, isSaved)}
            >
              <MaterialIcons name="delete" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.calculationSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Bruto:</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(item.monthly_breakdown.salario_bruto)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Líquido:</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>
              {formatCurrency(item.monthly_breakdown.salario_liquido)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCalculationModal = () => {
    if (!selectedCalculation) return null;

    const monthly = selectedCalculation.monthly_breakdown;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedCalculation.saved_name || 'Detalhes do Cálculo'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Resumo</Text>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Salário Bruto:</Text>
                  <Text style={[styles.modalValue, { color: '#f57c00' }]}>
                    {formatCurrency(monthly.salario_bruto)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Salário Líquido:</Text>
                  <Text style={[styles.modalValue, { color: theme.primary }]}>
                    {formatCurrency(monthly.salario_liquido)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalSection}>
                <Text style={[styles.modalSectionTitle, { color: theme.text }]}>Descontos</Text>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>IRPS:</Text>
                  <Text style={[styles.modalValue, { color: theme.text }]}>
                    {formatCurrency(monthly.irps)}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>INSS (3%):</Text>
                  <Text style={[styles.modalValue, { color: theme.text }]}>
                    {formatCurrency(monthly.inss_empregado)}
                  </Text>
                </View>
                {monthly.seguro_medico > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Seguro Médico:</Text>
                    <Text style={[styles.modalValue, { color: theme.text }]}>
                      {formatCurrency(monthly.seguro_medico)}
                    </Text>
                  </View>
                )}
                {monthly.emprestimos > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Empréstimos:</Text>
                    <Text style={[styles.modalValue, { color: theme.text }]}>
                      {formatCurrency(monthly.emprestimos)}
                    </Text>
                  </View>
                )}
                {monthly.outros_descontos > 0 && (
                  <View style={styles.modalRow}>
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Outros:</Text>
                    <Text style={[styles.modalValue, { color: theme.text }]}>
                      {formatCurrency(monthly.outros_descontos)}
                    </Text>
                  </View>
                )}
                <View style={[styles.modalRow, styles.modalTotalRow, { borderTopColor: theme.border }]}>
                  <Text style={[styles.modalLabel, { color: theme.primary, fontWeight: 'bold' }]}>Total:</Text>
                  <Text style={[styles.modalValue, { color: theme.primary, fontWeight: 'bold' }]}>
                    {formatCurrency(monthly.total_descontos)}
                  </Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    exportToPDF(selectedCalculation);
                    setModalVisible(false);
                  }}
                >
                  <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
                  <Text style={styles.modalActionText}>Exportar PDF</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = getStyles(theme);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Carregando histórico...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="history" size={32} color={theme.primary} />
        <Text style={styles.title}>Histórico de Cálculos</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
          onPress={() => setActiveTab('saved')}
        >
          <MaterialIcons name="bookmark" size={20} color={activeTab === 'saved' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}>
            Salvos ({savedCalculations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <MaterialIcons name="schedule" size={20} color={activeTab === 'recent' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
            Recentes ({recentCalculations.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'saved' ? savedCalculations : recentCalculations}
        renderItem={renderCalculationItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="folder-open" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {activeTab === 'saved' ? 'Nenhum cálculo salvo' : 'Nenhum cálculo recente'}
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              {activeTab === 'saved' 
                ? 'Salve cálculos na tela principal para vê-los aqui'
                : 'Faça alguns cálculos para ver o histórico'
              }
            </Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={loadCalculations}
      />

      {renderCalculationModal()}
    </SafeAreaView>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
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
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 12,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.card,
      gap: 8,
      ...theme.shadow,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    activeTabText: {
      color: '#fff',
    },
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    calculationItem: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...theme.shadow,
    },
    calculationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    calculationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    calculationDate: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    calculationType: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '500',
    },
    calculationActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: theme.secondary,
    },
    calculationSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryItem: {
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxHeight: '80%',
      borderRadius: 16,
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalSection: {
      marginBottom: 20,
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    modalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    modalLabel: {
      fontSize: 14,
    },
    modalValue: {
      fontSize: 14,
      fontWeight: '500',
    },
    modalTotalRow: {
      borderTopWidth: 1,
      paddingTop: 12,
      marginTop: 8,
    },
    modalActions: {
      marginTop: 20,
    },
    modalActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    modalActionText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
}