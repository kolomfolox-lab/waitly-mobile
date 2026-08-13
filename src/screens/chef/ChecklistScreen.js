import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, FlatList, Modal, SafeAreaView,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const COLORS = {
    primary: '#ff6b6b',
    success: '#52D681',
    warning: '#F7B731',
    background: '#f8f5f5',
    card: '#ffffff',
    border: '#e2e8f0',
    text: '#0f172a',
    muted: '#94a3b8',
    accent: '#667eea',
};

export default function ChecklistScreen() {
    const { user } = useAuth();
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const [commentModal, setCommentModal] = useState({ visible: false, taskId: null, comment: '' });

    const loadChecklists = useCallback(async () => {
        try {
            const res = await client.get('/checklists/items/', { params: { assigned_to_id: user?.id } });
            setChecklists(res.data || []);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { loadChecklists(); }, [loadChecklists]);

    const toggleTask = async (checklistId, task) => {
        try {
            await client.post(`/checklists/items/${checklistId}/complete/`, {
                tasks: [{
                    id: task.id,
                    is_completed: !task.is_completed,
                    comment: task.is_completed ? '' : task.comment,
                }],
            });
            loadChecklists();
        } catch {
            Alert.alert('Ошибка', 'Не удалось обновить статус.');
        }
    };

    const submitComment = async () => {
        const { taskId, comment } = commentModal;
        const checklist = checklists.find(c => c.tasks?.some(t => t.id === taskId));
        if (!checklist) return;
        try {
            await client.post(`/checklists/items/${checklist.id}/complete/`, {
                tasks: [{ id: taskId, is_completed: true, comment }],
            });
            setCommentModal({ visible: false, taskId: null, comment: '' });
            loadChecklists();
        } catch {
            Alert.alert('Ошибка', 'Не удалось сохранить комментарий.');
        }
    };

    const completeAll = async (checklist) => {
        const tasks = (checklist.tasks || []).map(t => ({ id: t.id, is_completed: true }));
        if (tasks.length === 0) return;
        try {
            await client.post(`/checklists/items/${checklist.id}/complete/`, { tasks });
            loadChecklists();
        } catch {
            Alert.alert('Ошибка', 'Не удалось завершить чек-лист.');
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Загрузка чек-листов...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.kicker}>Checklists</Text>
                    <Text style={styles.title}>Чек-листы</Text>
                    <Text style={styles.subtitle}>Выполнение ежедневных задач</Text>
                </View>
            </View>

            {checklists.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialIcons name="checklist" size={64} color={COLORS.muted} />
                    <Text style={styles.emptyTitle}>Нет активных чек-листов</Text>
                    <Text style={styles.emptyText}>Менеджер создаст шаблоны в админ-панели и назначит их на вас.</Text>
                </View>
            ) : (
                <FlatList
                    data={checklists}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ padding: 16, gap: 12 }}
                    renderItem={({ item }) => {
                        const completedCount = (item.tasks || []).filter(t => t.is_completed).length;
                        const totalCount = (item.tasks || []).length;
                        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                        return (
                            <View style={styles.checklistCard}>
                                <TouchableOpacity onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                    <View style={styles.checklistHeader}>
                                        <View>
                                            <Text style={styles.checklistName}>{item.template_name || 'Чек-лист'}</Text>
                                            <Text style={styles.checklistMeta}>
                                                {completedCount}/{totalCount} задач
                                                {item.assigned_to_name ? ` · ${item.assigned_to_name}` : ''}
                                            </Text>
                                        </View>
                                        <View style={[styles.statusBadge, {
                                            backgroundColor: item.status === 'COMPLETED' ? 'rgba(82,214,129,0.15)' : 'rgba(247,183,49,0.15)',
                                            borderColor: item.status === 'COMPLETED' ? COLORS.success : COLORS.warning,
                                        }]}>
                                            <Text style={[styles.statusBadgeText, {
                                                color: item.status === 'COMPLETED' ? COLORS.success : COLORS.warning,
                                            }]}>
                                                {item.status === 'COMPLETED' ? 'Готово' : item.status === 'IN_PROGRESS' ? 'В процессе' : 'Ожидает'}
                                            </Text>
                                        </View>
                                    </View>

                                    {totalCount > 0 && (
                                        <View style={styles.progressTrack}>
                                            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: progress === 100 ? COLORS.success : COLORS.accent }]} />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {expandedId === item.id && (
                                    <View style={{ marginTop: 12 }}>
                                        {(item.tasks || []).map(task => (
                                            <TouchableOpacity key={task.id} style={styles.taskRow} onPress={() => toggleTask(item.id, task)}>
                                                <MaterialIcons
                                                    name={task.is_completed ? 'check-circle' : 'radio-button-unchecked'}
                                                    size={22}
                                                    color={task.is_completed ? COLORS.success : COLORS.muted}
                                                />
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={[styles.taskTitle, task.is_completed && styles.taskCompleted]}>{task.title}</Text>
                                                    {task.description ? <Text style={styles.taskDesc}>{task.description}</Text> : null}
                                                </View>
                                                {task.is_photo_required && (
                                                    <MaterialIcons name="camera-alt" size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
                                                )}
                                                {task.is_comment_required && (
                                                    <TouchableOpacity onPress={() => setCommentModal({ visible: true, taskId: task.id, comment: task.comment || '' })}>
                                                        <MaterialIcons name="chat" size={16} color={COLORS.accent} />
                                                    </TouchableOpacity>
                                                )}
                                            </TouchableOpacity>
                                        ))}
                                        {item.status !== 'COMPLETED' && (
                                            <TouchableOpacity style={styles.completeAllButton} onPress={() => completeAll(item)}>
                                                <Text style={styles.completeAllText}>Отметить всё как выполненное</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    }}
                />
            )}

            {/* Comment Modal */}
            <Modal visible={commentModal.visible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Комментарий</Text>
                        <TextInput
                            value={commentModal.comment}
                            onChangeText={text => setCommentModal(prev => ({ ...prev, comment: text }))}
                            placeholder="Введите комментарий..."
                            style={styles.commentInput}
                            multiline
                            numberOfLines={3}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setCommentModal({ visible: false, taskId: null, comment: '' })} style={styles.modalCancel}>
                                <Text style={{ color: COLORS.muted, fontWeight: '700' }}>Отмена</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={submitComment} style={styles.modalConfirm}>
                                <Text style={{ color: COLORS.white, fontWeight: '700' }}>Сохранить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 12, color: COLORS.muted, fontWeight: '700' },
    header: { paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
    kicker: { color: '#8bd8ff', fontSize: 11, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
    title: { color: COLORS.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
    subtitle: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 16 },
    emptyText: { color: COLORS.muted, textAlign: 'center', marginTop: 8, lineHeight: 22 },
    checklistCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 18 },
    checklistHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    checklistName: { fontWeight: '900', fontSize: 16, color: COLORS.text },
    checklistMeta: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
    statusBadge: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontWeight: '800', fontSize: 11 },
    progressTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 10 },
    progressFill: { height: '100%', borderRadius: 3 },
    taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
    taskTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    taskCompleted: { textDecorationLine: 'line-through', color: COLORS.muted, opacity: 0.7 },
    taskDesc: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
    completeAllButton: { marginTop: 12, padding: 14, backgroundColor: 'rgba(102,126,234,0.1)', borderRadius: 14, alignItems: 'center' },
    completeAllText: { color: COLORS.accent, fontWeight: '800' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { width: '85%', backgroundColor: COLORS.card, borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 16 },
    commentInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, fontSize: 14, color: COLORS.text, minHeight: 80, textAlignVertical: 'top' },
    modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    modalCancel: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    modalConfirm: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.accent },
});
