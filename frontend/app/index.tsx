import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
  dependents: number;
  dependents_deduction: number;
  monthly_breakdown: {[key: string]: number};
  annual_breakdown: {[key: string]: number};
  calculation_type: string;
}

export default function SalaryCalculator() {
  const [calculationType, setCalculationType] = useState<'gross_to_net' | 'net_to_gross'>('gross_to_net');
  const [salary, setSalary] = useState('');
  const [medicalAid, setMedicalAid] = useState('');
  const [loans, setLoans] = useState('');
  const [otherDiscounts, setOtherDiscounts] = useState('');
  const [dependents, setDependents] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

  const calculateSalary = async () => {
    if (!salary) {
      Alert.alert('Erro', 'Por favor, insira o valor do salário');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/calculate-salary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salary: parseFloat(salary),
          calculation_type: calculationType,
          medical_aid: parseFloat(medicalAid) || 0,
          loans: parseFloat(loans) || 0,
          other_discounts: parseFloat(otherDiscounts) || 0,
          dependents: parseInt(dependents) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na requisição');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao calcular o salário. Tente novamente.');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setSalary('');
    setMedicalAid('');
    setLoans('');
    setOtherDiscounts('');
    setDependents('');
    setResult(null);
  };

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MTn`;
  };

  const generatePDFHTML = (result: CalculationResult) => {
    const monthly = result.monthly_breakdown;
    const currentDate = new Date().toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cálculo Salarial - Moçambique</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; color: #2E7D32; margin-bottom: 30px; border-bottom: 2px solid #2E7D32; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; padding: 5px 0; }
            .label { font-weight: bold; color: #333; }
            .value { color: #333; text-align: right; }
            .total { background-color: #f0f0f0; padding: 12px; border-radius: 5px; font-weight: bold; }
            .deduction { color: #d32f2f; }
            .net-salary { color: #2E7D32; font-size: 1.2em; }
            .gross-salary { color: #f57c00; font-size: 1.2em; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 15px; }
            .dependents-info { background-color: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Calculadora Salarial de Moçambique</h1>
            <p>Cálculo baseado na matriz oficial IRPS e INSS</p>
            <p><strong>Data do Cálculo:</strong> ${currentDate}</p>
          </div>
          
          <div class="section">
            <h2>Resumo do Cálculo</h2>
            <div class="row">
              <span class="label">Tipo de Cálculo:</span>
              <span class="value">${result.calculation_type === 'gross_to_net' ? 'Salário Bruto → Líquido' : 'Salário Líquido → Bruto'}</span>
            </div>
            <div class="row">
              <span class="label">Salário Bruto:</span>
              <span class="value gross-salary">${formatCurrency(monthly.salario_bruto)}</span>
            </div>
            <div class="row">
              <span class="label">Salário Líquido:</span>
              <span class="value net-salary">${formatCurrency(monthly.salario_liquido)}</span>
            </div>
            ${result.dependents > 0 ? `
              <div class="dependents-info">
                <div class="row">
                  <span class="label">Número de Dependentes:</span>
                  <span class="value">${result.dependents}</span>
                </div>
                <div class="row">
                  <span class="label">Dedução por Dependentes:</span>
                  <span class="value">${formatCurrency(result.dependents_deduction)}</span>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <h2>Detalhamento dos Descontos (Mensal)</h2>
            <div class="row">
              <span class="label">IRPS (Imposto sobre Rendimento):</span>
              <span class="value deduction">${formatCurrency(monthly.irps)}</span>
            </div>
            <div class="row">
              <span class="label">INSS Empregado (3%):</span>
              <span class="value deduction">${formatCurrency(monthly.inss_empregado)}</span>
            </div>
            <div class="row">
              <span class="label">INSS Empregador (4%):</span>
              <span class="value">${formatCurrency(monthly.inss_empregador)}</span>
            </div>
            ${monthly.seguro_medico > 0 ? `
              <div class="row">
                <span class="label">Seguro Médico:</span>
                <span class="value deduction">${formatCurrency(monthly.seguro_medico)}</span>
              </div>
            ` : ''}
            ${monthly.emprestimos > 0 ? `
              <div class="row">
                <span class="label">Empréstimos:</span>
                <span class="value deduction">${formatCurrency(monthly.emprestimos)}</span>
              </div>
            ` : ''}
            ${monthly.outros_descontos > 0 ? `
              <div class="row">
                <span class="label">Outros Descontos:</span>
                <span class="value deduction">${formatCurrency(monthly.outros_descontos)}</span>
              </div>
            ` : ''}
            <div class="row total">
              <span class="label">Total de Descontos:</span>
              <span class="value deduction">${formatCurrency(monthly.total_descontos)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Valores Anuais</h2>
            <div class="row">
              <span class="label">Salário Bruto Anual:</span>
              <span class="value gross-salary">${formatCurrency(result.annual_breakdown.salario_bruto)}</span>
            </div>
            <div class="row">
              <span class="label">Salário Líquido Anual:</span>
              <span class="value net-salary">${formatCurrency(result.annual_breakdown.salario_liquido)}</span>
            </div>
            <div class="row">
              <span class="label">Total de Descontos Anual:</span>
              <span class="value deduction">${formatCurrency(result.annual_breakdown.total_descontos)}</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Calculadora Salarial de Moçambique</strong></p>
            <p>Cálculos baseados na matriz oficial IRPS e tabelas INSS de 2025</p>
            <p>Este documento foi gerado automaticamente e serve apenas para fins informativos</p>
          </div>
        </body>
      </html>
    `;
  };

  const downloadPDF = async () => {
    if (!result) {
      Alert.alert('Erro', 'Nenhum resultado disponível para download');
      return;
    }

    try {
      const html = generatePDFHTML(result);
      const { uri } = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Compartilhar Cálculo Salarial',
        });
      } else {
        Alert.alert('Sucesso', 'PDF gerado com sucesso! Verifique os seus downloads.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar PDF. Tente novamente.');
      console.error('PDF generation error:', error);
    }
  };

  const renderCalculationTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={styles.sectionTitle}>Tipo de Cálculo</Text>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            calculationType === 'gross_to_net' && styles.typeButtonActive
          ]}
          onPress={() => setCalculationType('gross_to_net')}
        >
          <MaterialIcons 
            name="trending-down" 
            size={20} 
            color={calculationType === 'gross_to_net' ? '#fff' : '#2E7D32'} 
          />
          <Text style={[
            styles.typeButtonText,
            calculationType === 'gross_to_net' && styles.typeButtonTextActive
          ]}>
            Bruto → Líquido
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            calculationType === 'net_to_gross' && styles.typeButtonActive
          ]}
          onPress={() => setCalculationType('net_to_gross')}
        >
          <MaterialIcons 
            name="trending-up" 
            size={20} 
            color={calculationType === 'net_to_gross' ? '#fff' : '#2E7D32'} 
          />
          <Text style={[
            styles.typeButtonText,
            calculationType === 'net_to_gross' && styles.typeButtonTextActive
          ]}>
            Líquido → Bruto
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInputForm = () => (
    <View style={styles.inputSection}>
      <Text style={styles.sectionTitle}>Dados do Salário</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {calculationType === 'gross_to_net' ? 'Salário Bruto (MTn)' : 'Salário Líquido (MTn)'}
        </Text>
        <TextInput
          style={styles.textInput}
          value={salary}
          onChangeText={setSalary}
          placeholder="Ex: 50000"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Seguro Médico (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={medicalAid}
          onChangeText={setMedicalAid}
          placeholder="Ex: 1500"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Empréstimos (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={loans}
          onChangeText={setLoans}
          placeholder="Ex: 5000"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Outros Descontos (MTn)</Text>
        <TextInput
          style={styles.textInput}
          value={otherDiscounts}
          onChangeText={setOtherDiscounts}
          placeholder="Ex: 2000"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Número de Dependentes</Text>
        <TextInput
          style={styles.textInput}
          value={dependents}
          onChangeText={setDependents}
          placeholder="Ex: 2"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
        <Text style={styles.inputHelperText}>
          Dedução de 5.000 MTn por dependente (cônjuge, filhos menores, etc.)
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.clearButton} onPress={clearForm}>
          <MaterialIcons name="clear" size={20} color="#666" />
          <Text style={styles.clearButtonText}>Limpar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.calculateButton} 
          onPress={calculateSalary}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <MaterialIcons name="calculate" size={20} color="#fff" />
              <Text style={styles.calculateButtonText}>Calcular</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResults = () => {
    if (!result) return null;

    const currentBreakdown = viewMode === 'monthly' ? result.monthly_breakdown : result.annual_breakdown;

    return (
      <View style={styles.resultsSection}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Resultado do Cálculo</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'monthly' && styles.toggleButtonActive]}
              onPress={() => setViewMode('monthly')}
            >
              <Text style={[styles.toggleText, viewMode === 'monthly' && styles.toggleTextActive]}>
                Mensal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'annual' && styles.toggleButtonActive]}
              onPress={() => setViewMode('annual')}
            >
              <Text style={[styles.toggleText, viewMode === 'annual' && styles.toggleTextActive]}>
                Anual
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Salário Bruto:</Text>
            <Text style={styles.summaryValueGross}>
              {formatCurrency(currentBreakdown.salario_bruto)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Salário Líquido:</Text>
            <Text style={styles.summaryValueNet}>
              {formatCurrency(currentBreakdown.salario_liquido)}
            </Text>
          </View>
          {result.dependents > 0 && (
            <View style={styles.dependentsInfo}>
              <Text style={styles.dependentsTitle}>Informações dos Dependentes</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.dependentsLabel}>Número de Dependentes:</Text>
                <Text style={styles.dependentsValue}>{result.dependents}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.dependentsLabel}>Dedução Total:</Text>
                <Text style={styles.dependentsValue}>
                  {formatCurrency(result.dependents_deduction)}
                </Text>
              </View>
            </View>
          )}
          <TouchableOpacity style={styles.pdfButton} onPress={downloadPDF}>
            <MaterialIcons name="picture-as-pdf" size={20} color="#fff" />
            <Text style={styles.pdfButtonText}>Baixar PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detalhamento dos Descontos</Text>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="account-balance" size={16} color="#f44336" />
            <Text style={styles.detailLabel}>IRPS:</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(currentBreakdown.irps)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="security" size={16} color="#f44336" />
            <Text style={styles.detailLabel}>INSS (Empregado 3%):</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(currentBreakdown.inss_empregado)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="business" size={16} color="#666" />
            <Text style={styles.detailLabel}>INSS (Empregador 4%):</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(currentBreakdown.inss_empregador)}
            </Text>
          </View>

          {currentBreakdown.seguro_medico > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="local-hospital" size={16} color="#f44336" />
              <Text style={styles.detailLabel}>Seguro Médico:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(currentBreakdown.seguro_medico)}
              </Text>
            </View>
          )}

          {currentBreakdown.emprestimos > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="attach-money" size={16} color="#f44336" />
              <Text style={styles.detailLabel}>Empréstimos:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(currentBreakdown.emprestimos)}
              </Text>
            </View>
          )}

          {currentBreakdown.outros_descontos > 0 && (
            <View style={styles.detailRow}>
              <MaterialIcons name="remove-circle" size={16} color="#f44336" />
              <Text style={styles.detailLabel}>Outros Descontos:</Text>
              <Text style={styles.detailValue}>
                {formatCurrency(currentBreakdown.outros_descontos)}
              </Text>
            </View>
          )}

          <View style={[styles.detailRow, styles.totalRow]}>
            <MaterialIcons name="calculate" size={16} color="#2E7D32" />
            <Text style={styles.totalLabel}>Total de Descontos:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(currentBreakdown.total_descontos)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <MaterialIcons name="calculate" size={32} color="#2E7D32" />
            <Text style={styles.title}>Calculadora Salarial</Text>
            <Text style={styles.subtitle}>Moçambique • IRPS & INSS • 2025</Text>
          </View>

          {renderCalculationTypeSelector()}
          {renderInputForm()}
          {renderResults()}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Cálculos baseados nas tabelas oficiais de IRPS e INSS de Moçambique para 2025
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  typeSelector: {
    marginBottom: 24,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#fff',
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: '#2E7D32',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputHelperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  calculateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
    gap: 8,
  },
  calculateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#2E7D32',
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  summaryValueGross: {
    fontSize: 18,
    color: '#f57c00',
    fontWeight: 'bold',
  },
  summaryValueNet: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 8,
  },
  totalValue: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  dependentsInfo: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  dependentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  dependentsLabel: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  dependentsValue: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f44336',
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});