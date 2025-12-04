import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Check, DiamondIcon } from 'lucide-react-native';
import { theme } from '../theme';
import type { Question, QuestionAnswer } from '@repo/api/types/questionnaire';
import { calculateQuestionFee } from '@repo/api/operations/questionnaire';
import { centsToCredits } from '@repo/utils/credits';
import { useTypedTranslation } from '../i18n/typed';

interface QuestionnaireFormProps {
    questions: Question[];
    answers: Omit<QuestionAnswer, 'feeApplied'>[];
    onAnswersChange: (answers: Omit<QuestionAnswer, 'feeApplied'>[]) => void;
}

export function QuestionnaireForm({
    questions,
    answers,
    onAnswersChange,
}: QuestionnaireFormProps) {
    const { t } = useTypedTranslation();

    const getAnswer = useCallback((questionId: string) => {
        return answers.find(a => a.questionId === questionId);
    }, [answers]);

    const updateAnswer = useCallback((questionId: string, update: Partial<Omit<QuestionAnswer, 'feeApplied'>>) => {
        const existingIndex = answers.findIndex(a => a.questionId === questionId);
        let newAnswers: Omit<QuestionAnswer, 'feeApplied'>[];

        if (existingIndex >= 0) {
            newAnswers = answers.map((a, i) =>
                i === existingIndex ? { ...a, ...update } : a
            );
        } else {
            newAnswers = [...answers, { questionId, ...update }];
        }

        onAnswersChange(newAnswers);
    }, [answers, onAnswersChange]);

    const calculateFeeDisplay = useCallback((question: Question, answer: Omit<QuestionAnswer, 'feeApplied'> | undefined) => {
        if (!answer) return 0;
        const fee = calculateQuestionFee(question, { ...answer, feeApplied: 0 });
        return Math.ceil(centsToCredits(fee));
    }, []);

    const totalFees = useMemo(() => {
        const totalCents = questions.reduce((total, question) => {
            const answer = getAnswer(question.id);
            if (!answer) return total;
            return total + calculateQuestionFee(question, { ...answer, feeApplied: 0 });
        }, 0);
        return Math.ceil(centsToCredits(totalCents));
    }, [questions, answers, getAnswer]);

    const renderBooleanQuestion = (question: Question) => {
        const answer = getAnswer(question.id);
        const currentValue = answer?.booleanAnswer;
        const fee = question.booleanConfig?.feeOnTrue;

        return (
            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={[
                        styles.optionButton,
                        currentValue === true && styles.optionButtonSelected,
                    ]}
                    onPress={() => updateAnswer(question.id, { booleanAnswer: true })}
                >
                    <View style={[styles.checkbox, currentValue === true && styles.checkboxSelected]}>
                        {currentValue === true && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={styles.optionLabel}>{t('questionnaire.yes')}</Text>
                    {fee !== undefined && fee > 0 && (
                        <View style={styles.feeBadge}>
                            <DiamondIcon size={12} color={theme.colors.amber[600]} />
                            <Text style={styles.feeBadgeText}>{Math.ceil(centsToCredits(fee))}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.optionButton,
                        currentValue === false && styles.optionButtonSelected,
                    ]}
                    onPress={() => updateAnswer(question.id, { booleanAnswer: false })}
                >
                    <View style={[styles.checkbox, currentValue === false && styles.checkboxSelected]}>
                        {currentValue === false && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={styles.optionLabel}>{t('questionnaire.no')}</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderSingleSelectQuestion = (question: Question) => {
        const answer = getAnswer(question.id);
        const currentValue = answer?.singleSelectAnswer;

        return (
            <View style={styles.optionsContainer}>
                {question.options?.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.optionButton,
                            currentValue === option.id && styles.optionButtonSelected,
                        ]}
                        onPress={() => updateAnswer(question.id, { singleSelectAnswer: option.id })}
                    >
                        <View style={[styles.radio, currentValue === option.id && styles.radioSelected]}>
                            {currentValue === option.id && <View style={styles.radioInner} />}
                        </View>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                        {option.fee !== undefined && option.fee > 0 && (
                            <View style={styles.feeBadge}>
                                <DiamondIcon size={12} color={theme.colors.amber[600]} />
                                <Text style={styles.feeBadgeText}>{Math.ceil(centsToCredits(option.fee))}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderMultiSelectQuestion = (question: Question) => {
        const answer = getAnswer(question.id);
        const currentValues = answer?.multiSelectAnswer || [];

        const toggleOption = (optionId: string) => {
            const newValues = currentValues.includes(optionId)
                ? currentValues.filter(id => id !== optionId)
                : [...currentValues, optionId];
            updateAnswer(question.id, { multiSelectAnswer: newValues });
        };

        return (
            <View style={styles.optionsContainer}>
                {question.options?.map((option) => {
                    const isSelected = currentValues.includes(option.id);
                    return (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionButton,
                                isSelected && styles.optionButtonSelected,
                            ]}
                            onPress={() => toggleOption(option.id)}
                        >
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <Check size={14} color="#fff" />}
                            </View>
                            <Text style={styles.optionLabel}>{option.label}</Text>
                            {option.fee !== undefined && option.fee > 0 && (
                                <View style={styles.feeBadge}>
                                    <Text style={styles.feeBadgeText}>+</Text>
                                    <DiamondIcon size={12} color={theme.colors.amber[600]} />
                                    <Text style={styles.feeBadgeText}>{Math.ceil(centsToCredits(option.fee))}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    const renderNumberQuestion = (question: Question) => {
        const answer = getAnswer(question.id);
        const currentValue = answer?.numberAnswer;
        const config = question.numberConfig;

        return (
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    keyboardType={config?.integer ? 'number-pad' : 'decimal-pad'}
                    placeholder={
                        config?.min !== undefined && config?.max !== undefined
                            ? `${config.min} - ${config.max}`
                            : t('questionnaire.enterNumber')
                    }
                    value={currentValue !== undefined ? String(currentValue) : ''}
                    onChangeText={(text) => {
                        const num = config?.integer ? parseInt(text, 10) : parseFloat(text);
                        if (!isNaN(num)) {
                            updateAnswer(question.id, { numberAnswer: num });
                        } else if (text === '') {
                            updateAnswer(question.id, { numberAnswer: undefined });
                        }
                    }}
                />
                {config?.fee !== undefined && config.fee > 0 && (
                    <View style={styles.feeNoteContainer}>
                        <Text style={styles.feeNote}>{t('questionnaire.feeIfProvided')}</Text>
                        <DiamondIcon size={12} color={theme.colors.amber[600]} />
                        <Text style={styles.feeNote}>{Math.ceil(centsToCredits(config.fee))}</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderTextQuestion = (question: Question) => {
        const answer = getAnswer(question.id);
        const currentValue = answer?.textAnswer;
        const config = question.textConfig;

        return (
            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder={t('questionnaire.enterText')}
                    value={currentValue || ''}
                    onChangeText={(text) => updateAnswer(question.id, { textAnswer: text })}
                    multiline
                    maxLength={config?.maxLength}
                />
                {config?.maxLength && (
                    <Text style={styles.charCount}>
                        {(currentValue?.length || 0)}/{config.maxLength}
                    </Text>
                )}
                {config?.fee !== undefined && config.fee > 0 && (
                    <View style={styles.feeNoteContainer}>
                        <Text style={styles.feeNote}>{t('questionnaire.feeIfProvided')}</Text>
                        <DiamondIcon size={12} color={theme.colors.amber[600]} />
                        <Text style={styles.feeNote}>{Math.ceil(centsToCredits(config.fee))}</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderQuestion = (question: Question, index: number) => {
        return (
            <View key={question.id} style={styles.questionContainer}>
                <View style={styles.questionHeader}>
                    <Text style={styles.questionText}>
                        {index + 1}. {question.question}
                        {question.required && <Text style={styles.required}> *</Text>}
                    </Text>
                </View>

                {question.type === 'boolean' && renderBooleanQuestion(question)}
                {question.type === 'single_select' && renderSingleSelectQuestion(question)}
                {question.type === 'multi_select' && renderMultiSelectQuestion(question)}
                {question.type === 'number' && renderNumberQuestion(question)}
                {question.type === 'text' && renderTextQuestion(question)}
            </View>
        );
    };

    if (questions.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {questions.map((question, index) => renderQuestion(question, index))}

            {totalFees > 0 && (
                <View style={styles.totalFeesContainer}>
                    <Text style={styles.totalFeesLabel}>{t('questionnaire.additionalFees')}:</Text>
                    <View style={styles.totalFeesValueContainer}>
                        <Text style={styles.totalFeesValue}>+</Text>
                        <DiamondIcon size={16} color={theme.colors.amber[600]} />
                        <Text style={styles.totalFeesValue}>{totalFees}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.zinc[50],
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.zinc[900],
        marginBottom: 16,
    },
    questionContainer: {
        marginBottom: 20,
    },
    questionHeader: {
        marginBottom: 8,
    },
    questionText: {
        fontSize: theme.fontSize.base,
        fontWeight: '500',
        color: theme.colors.zinc[800],
    },
    required: {
        color: theme.colors.rose[500],
    },
    optionsContainer: {
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
    },
    optionButtonSelected: {
        borderColor: theme.colors.emerald[500],
        backgroundColor: theme.colors.emerald[50],
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.zinc[300],
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: theme.colors.emerald[500],
        borderColor: theme.colors.emerald[500],
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: theme.colors.zinc[300],
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: {
        borderColor: theme.colors.emerald[500],
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.emerald[500],
    },
    optionLabel: {
        flex: 1,
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[700],
    },
    feeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.amber[50],
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 2,
    },
    feeBadgeText: {
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.amber[600],
    },
    inputContainer: {
        gap: 4,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.zinc[200],
        padding: 12,
        fontSize: theme.fontSize.base,
        color: theme.colors.zinc[900],
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.zinc[400],
        textAlign: 'right',
    },
    feeNoteContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 2,
    },
    feeNote: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.amber[600],
    },
    totalFeesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colors.zinc[200],
    },
    totalFeesLabel: {
        fontSize: theme.fontSize.base,
        fontWeight: '500',
        color: theme.colors.zinc[700],
    },
    totalFeesValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    totalFeesValue: {
        fontSize: theme.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.amber[600],
    },
});

