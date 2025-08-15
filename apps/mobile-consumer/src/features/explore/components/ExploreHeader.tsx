import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTypedTranslation } from '../../../i18n/typed';

export type TabType = 'businesses' | 'classes';

interface ExploreHeaderProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const ExploreHeader = memo<ExploreHeaderProps>(({ activeTab, onTabChange }) => {
    const { t } = useTypedTranslation();

    return (
        <View style={styles.header}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'businesses' && styles.activeTab]}
                    onPress={() => onTabChange('businesses')}
                >
                    <Text style={[styles.tabText, activeTab === 'businesses' && styles.activeTabText]}>
                        {t('explore.businesses')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'classes' && styles.activeTab]}
                    onPress={() => onTabChange('classes')}
                >
                    <Text style={[styles.tabText, activeTab === 'classes' && styles.activeTabText]}>
                        {t('explore.classes')}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

ExploreHeader.displayName = 'ExploreHeader';

const styles = StyleSheet.create({
    header: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#333',
    },
}); 