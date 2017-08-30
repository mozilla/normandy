from django.template.loader import render_to_string


def pick_pair(genome, base_color):
    good_pairs = [
        color for color in genome.colors if base_color.contrasts_well(color)]
    assert len(good_pairs), 'no colors satisfy the luminance requirement'
    return genome.choice(good_pairs)


def single_color(genome, context):
    context['treatment'] = 'SingleColor'
    return context


def two_color(genome, context):
    context['treatment'] = 'TwoColor'
    areas = [
        'top',
        'bottom',
        'left',
        'right',
        'topLeft',
        'topRight',
        'bottomLeft',
        'bottomRight',
    ]
    area = genome.choice(areas)
    rotations = {
        'top': 0,
        'topRight': 45,
        'right': 90,
        'bottomRight': 135,
        'bottom': 180,
        'bottomLeft': 225,
        'left': 270,
        'topLeft': 315,
    }
    context['transform'] = f'scale(100) rotate({rotations[area]} 0.5,0.5)'
    return context


def stripes(genome, context):
    context['treatment'] = 'Stripes'
    count = genome.randint(1, 4)
    padding = genome.uniform(0.1, 0.4)
    directions = ['vertical', 'horizontal', 'diagonal1', 'diagonal2']
    direction = genome.choice(directions)
    stride = (1 - 2 * padding) / (2 * count + 1)

    context['stripe_x_list'] = [
        padding + stride * (2 * i + 1) for i in range(count)]
    context['stride'] = stride
    rotations = {
        'vertical': 0,
        'diagonal1': 45,
        'horizontal': 90,
        'diagonal2': 135
    }
    context['transform'] = f'scale(100) rotate({rotations[direction]} 0.5,0.5)'
    return context


def generate_svg(genome):
    treatments = [
        {'function': single_color, 'weight': 1},
        {'function': two_color, 'weight': 4},
        {'function': stripes, 'weight': 6},
    ]
    update_context_with_treatment = genome.weighted_choice(treatments)['function']
    emoji = genome.emoji()
    field_color = genome.color()
    pattern_color = pick_pair(genome, field_color)
    context = {
        'emoji': emoji,
        'field_color': field_color.get_css_color(),
        'pattern_color': pattern_color.get_css_color(),
    }
    update_context_with_treatment(genome, context)

    return render_to_string('identicon.svg', context)
